/* ====================================================================
   Licensed to the Apache Software Foundation (ASF) under one or more
   contributor license agreements.  See the NOTICE file distributed with
   this work for additional information regarding copyright ownership.
   The ASF licenses this file to You under the Apache License, Version 2.0
   (the "License"); you may not use this file except in compliance with
   the License.  You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
==================================================================== */
package com.dishui.util.excel;

import com.dishui.db.mango.MongoProvider;
import org.apache.poi.openxml4j.opc.OPCPackage;
import org.apache.poi.xssf.eventusermodel.XSSFReader;
import org.apache.poi.xssf.model.SharedStringsTable;
import org.apache.poi.xssf.usermodel.XSSFRichTextString;
import org.xml.sax.*;
import org.xml.sax.helpers.DefaultHandler;
import org.xml.sax.helpers.XMLReaderFactory;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import java.util.logging.Logger;

/**
 * XSSF and SAX (Event API)
 */
public class XssfEventHandler {
    private static final Logger log = Logger.getLogger(XssfEventHandler.class.getName());
    private int sheetIndex = -1;
    private RowHandler rowHandler;

    public void setRowHandler(RowHandler rowHandler) {
        this.rowHandler = rowHandler;
//        log.info("rowHandler hash===="+this.rowHandler.hashCode());
    }
    public RowHandler getRowHandler() {
        return this.rowHandler;
    }
    public void processOneSheet(String filename) throws Exception {
        OPCPackage pkg = OPCPackage.open(filename);
        XSSFReader r = new XSSFReader( pkg );
        SharedStringsTable sst = r.getSharedStringsTable();

        XMLReader parser = fetchSheetParser(sst);

        // rId2 found by processing the Workbook
        // Seems to either be rId# or rSheet#
        InputStream sheet1 = r.getSheet("rId1");
        InputSource sheetSource = new InputSource(sheet1);
        parser.parse(sheetSource);
        sheet1.close();
    }

    public void processAllSheets(String filename) throws Exception {
        log.info("begin xlsx process:");
        long time = System.currentTimeMillis();
        Runtime run = Runtime.getRuntime();
        long max1 = run.maxMemory();
        long total1 = run.totalMemory();
        long free1 = run.freeMemory();
        long usable1 = max1 - total1 + free1;
        log.info("最大内存 = " + max1/1024/1024+"M");
//		log.info("已分配内存 = " + total/1024/1024+"M"); 
//		log.info("已分配内存中的剩余空间 = " + free/1024/1024+"M"); 
        log.info("最大可用内存 = " + usable1/1024/1024+"M");

        OPCPackage pkg = OPCPackage.open(MongoProvider.getFileStreamById(filename));
        XSSFReader r = new XSSFReader( pkg );
        SharedStringsTable sst = r.getSharedStringsTable();
        XMLReader parser = fetchSheetParser(sst);


        Iterator<InputStream> sheets = r.getSheetsData();
        while(sheets.hasNext()) {
            System.out.println("Processing new sheet:\n");
            sheetIndex++;
            InputStream sheet = sheets.next();
            InputSource sheetSource = new InputSource(sheet);
            parser.parse(sheetSource);
            sheet.close();
//			System.out.println("");
        }
        long max = run.maxMemory();
        long total = run.totalMemory();
        long free = run.freeMemory();
        long usable = max - total + free;
//		log.info("最大内存 = " + max/1024/1024+"M");
//		log.info("已分配内存 = " + total/1024/1024+"M"); 
//		log.info("已分配内存中的剩余空间 = " + free/1024/1024+"M"); 
        log.info("最大可用内存 = " + usable/1024/1024+"M");
        long duration = System.currentTimeMillis() - time;
        String msg = String.format("%s消耗时间[%d ms]", "parse sheet", duration);

        log.info(msg);
    }

    public XMLReader fetchSheetParser(SharedStringsTable sst) throws SAXException {
        XMLReader parser = XMLReaderFactory
                .createXMLReader("org.apache.xerces.parsers.SAXParser");
        ContentHandler handler = new SheetHandler(sst);
        parser.setContentHandler(handler);
        return parser;
    }

    /**
     * See org.xml.sax.helpers.DefaultHandler javadocs
     */
    private  class SheetHandler extends DefaultHandler {
        private SharedStringsTable sst;
        private String lastContents;
        private boolean nextIsString;

        private int curRow = 0; // 当前行
        private int curCol = 0; // 当前列索引
        private int preCol = 0; // 上一列列索引
        private int titleRow = 0; // 标题行
        private int colsize = 0; // 列数
        private List<String> collist = new ArrayList<String>();

        private SheetHandler(SharedStringsTable sst) {
            this.sst = sst;
        }

        public void startElement(String uri, String localName, String name,
                                 Attributes attributes) throws SAXException {
            // c => cell
            if(name.equals("c")) {
                // Print the cell reference
//				System.out.print(attributes.getValue("r") + " - ");
                String rowStr = attributes.getValue("r");
                curCol = this.getRowIndex(rowStr);
                // Figure out if the value is an index in the SST
                String cellType = attributes.getValue("t");
                if(cellType != null && cellType.equals("s")) {
                    nextIsString = true;
                } else {
                    nextIsString = false;
                }
            }
            // Clear contents cache
            lastContents = "";
        }

        public void endElement(String uri, String localName, String name)
                throws SAXException {
            // Process the last contents as required.
            // Do now, as characters() may be called more than once
            if(nextIsString) {
                int idx = Integer.parseInt(lastContents);
                lastContents = new XSSFRichTextString(sst.getEntryAt(idx)).toString();
                nextIsString=false;
            }

            // v => contents of a cell
            // Output after we've seen the string contents
            if(name.equals("v") || name.equals("t")/*for export excel */) {
                String value=lastContents.trim();
                int cols = curCol-preCol;
                if (cols > 1) {
                    for (int i = 0; i < cols - 1; i++) {
                        collist.add(preCol, "");
                    }
                }
                preCol = curCol;
                collist.add(curCol-1, value);

//				value = value.equals("")?" ":value;
//				System.out.println(lastContents);
            }else{
                if (name.equals("row")) {//行尾
                    int tmpCols = collist.size();
                    if (curRow > this.titleRow && tmpCols < this.colsize) {
                        for (int i = 0; i < this.colsize - tmpCols; i++) {
                            collist.add(collist.size(), "");
                        }
                    }
//					printRow(curRow,collist);
                    int count=0;
                    for(String cell :collist){
                        if(!"".equals(cell) && !" ".equals(cell)){
                            break;
                        }else{
                            count++;
                        }
                    }
                    if(count<collist.size()){
                        rowHandler.processRow(sheetIndex, curRow, collist);
                    }
                    if (curRow == this.titleRow) {
                        this.colsize = collist.size();
                    }
                    collist.clear();
                    curRow++;
                    curCol = 0;
                    preCol = 0;
                }
            }
        }

        public void characters(char[] ch, int start, int length)
                throws SAXException {
            lastContents += new String(ch, start, length);
        }
        public int getRowIndex(String rowStr) {
            rowStr = rowStr.replaceAll("[^A-Z]", "");
            byte[] rowAbc = rowStr.getBytes();
            int len = rowAbc.length;
            float num = 0;
            for (int i = 0; i < len; i++) {
                num += (rowAbc[i] - 'A' + 1) * Math.pow(26, len - i - 1);
            }
            return (int) num;
        }

        public void printRow( int curRow, List<String> collist){
            System.out.print(curRow+":");
            for (int i = 0; i < collist.size(); i++) {
                System.out.print("'" + collist.get(i) + "',");
            }
            System.out.println();
        }
    }

    public static void main(String[] args) throws Exception {
        XssfEventHandler howto = new XssfEventHandler();
//		howto.processOneSheet("11_1.xlsx");
        howto.processAllSheets("11_1w_2.xlsx");
    }
}
