package com.dishui.util.excel;

import com.dishui.exception.SaxParserHeadException;
import com.dishui.manager.command.Fields;
import com.dishui.manager.service.AppConfig;
import org.apache.poi.hssf.usermodel.HSSFCell;
import org.apache.poi.hssf.usermodel.HSSFRow;
import org.apache.poi.hssf.usermodel.HSSFSheet;
import org.apache.poi.hssf.usermodel.HSSFWorkbook;
import org.apache.poi.openxml4j.opc.OPCPackage;
import org.apache.poi.xssf.eventusermodel.XSSFReader;
import org.apache.poi.xssf.model.SharedStringsTable;
import org.apache.poi.xssf.usermodel.XSSFRichTextString;
import org.xml.sax.*;
import org.xml.sax.helpers.DefaultHandler;
import org.xml.sax.helpers.XMLReaderFactory;

import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import java.util.logging.Level;
import java.util.logging.Logger;


public class ExcelHeadHandler2 {
	private static final Logger log = Logger.getLogger(ExcelHeadHandler2.class.getName());
    private List<String> heads=new ArrayList<String>();
	public  List<String> process(String fileId,String fileName){
		try {
			if(fileName.endsWith(Fields.EXTENSION_03)){
				return getHssfHeader(fileId);
			}else if(fileName.endsWith(Fields.EXTENSION_07)){
				return getXssfHeader(fileId);
			}else{
				throw new  Exception("文件格式错误,扩展名只能是xls或xlsx.");
			}
		} catch (IOException e) {
			e.printStackTrace();
		} catch (Exception e) {
			e.printStackTrace();
		}finally {
            Runtime run = Runtime.getRuntime();
            long max = run.maxMemory();
            long total = run.totalMemory();
            long free = run.freeMemory();
            long usable = max - total + free;
            log.info("最大可用内存2 = " + usable/1024/1024+"M");
        }
        return null;
	}

	private  List<String> getXssfHeader(String file) throws Exception{
        log.info("begin getXssfHeader process:");
        long time = System.currentTimeMillis();
        Runtime run = Runtime.getRuntime();
        long max1 = run.maxMemory();
        long total1 = run.totalMemory();
        long free1 = run.freeMemory();
        long usable1 = max1 - total1 + free1;
        log.info("最大内存 = " + max1/1024/1024+"M");
        log.info("最大可用内存 = " + usable1/1024/1024+"M");
//        String impPath="/Users/hotchwong/tmp/kmTemp/50w.xlsx";
        String impPath = AppConfig.getInstance().getVar("export.dir")+file;
        log.info("xlsx impPath ======= " + impPath);
//        OPCPackage pkg = OPCPackage.open(MongoProvider.getFileStreamById(file));
        OPCPackage pkg = OPCPackage.open(impPath);
        XSSFReader r = new XSSFReader( pkg );
        SharedStringsTable sst = r.getSharedStringsTable();
        XMLReader parser = fetchSheetParser(sst);
//        InputStream sheet = r.getSheet("rId2");
        Iterator<InputStream> sheets = r.getSheetsData();
        max1 = run.maxMemory();
        total1 = run.totalMemory();
        free1 = run.freeMemory();
        usable1 = max1 - total1 + free1;
        log.info("最大可用内存1-3 = " + usable1/1024/1024+"M");
        while(sheets.hasNext()) {
            InputStream sheet = sheets.next();
            InputSource sheetSource = new InputSource(sheet);
            try {
                parser.parse(sheetSource);
            } catch (SaxParserHeadException e) {
                e.printStackTrace();
                log.log(Level.WARNING,e.getMessage());
            }
            sheet.close();
            break;
        }
        long duration = System.currentTimeMillis() - time;
        String msg = String.format("%s消耗时间[%d ms]", "parse xssf header", duration);
        log.info(msg);
        return heads;
	}
	private  List<String> getHssfHeader(String file) throws IOException{
		List<String> heads=new ArrayList<String>();
        String impPath = AppConfig.getInstance().getVar("export.dir")+file;
        log.info("xls impPath ======= " + impPath);
        Runtime run = Runtime.getRuntime();
        long max1 = run.maxMemory();
        long total1 = run.totalMemory();
        long free1 = run.freeMemory();
        long usable1 = max1 - total1 + free1;
        log.info("最大内存 = " + max1/1024/1024+"M");
        log.info("最大可用内存 = " + usable1/1024/1024+"M");

        HSSFWorkbook wb=new HSSFWorkbook(new FileInputStream(impPath));
        max1 = run.maxMemory();
        total1 = run.totalMemory();
        free1 = run.freeMemory();
        usable1 = max1 - total1 + free1;
        log.info("最大可用内存1-3 = " + usable1/1024/1024+"M");
		HSSFSheet sheet = wb.getSheetAt(0);
		int rows = sheet.getPhysicalNumberOfRows();
		if(rows>0){
			HSSFRow row=sheet.getRow(0);
			if(row!=null){
				int cells=row.getPhysicalNumberOfCells();
				for (int i = 0; i < cells; i++) {
					HSSFCell cell=row.getCell(i);
					String value=cell.getStringCellValue()==null?"":cell.getStringCellValue().trim();
					heads.add(value);
				}
			}
		}
		
		return heads;
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
            if(curRow>0){
                throw new SaxParserHeadException("201","已读取表头");
            }
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
//            if(attributes!=null){
//                for(int i=0;i<attributes.getLength();i++){
//                    System.out.println("attribute=="+attributes.getQName(i)+" "+attributes.getValue(i));
//                }
//            }
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
            if(name.equals("v") || name.equals("t")) {
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
//				System.out.println("11=="+curRow+" "+lastContents);
            }else{
                if (name.equals("row")) {//行尾
                    int tmpCols = collist.size();
                    if (curRow > this.titleRow && tmpCols < this.colsize) {
                        for (int i = 0; i < this.colsize - tmpCols; i++) {
                            collist.add(collist.size(), "");
                        }
                    }
                    int count=0;
                    for(String cell :collist){
                        if(!"".equals(cell) && !" ".equals(cell)){
                            break;
                        }else{
                            count++;
                        }
                    }

                    if(count<collist.size()){
//                        System.out.println("22=="+curRow+" "+collist.size());
                        setHead(curRow, collist);
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

        public void setHead(int curRow, List<String> collist){
            StringBuffer str=new StringBuffer(curRow+":");
            for (int i = 0; i < collist.size(); i++) {
                String cell=collist.get(i);
                cell=cell==null?"":cell.trim();
                ExcelHeadHandler2.this.heads.add(cell);
                str.append("'" + cell + "',");
            }
            log.info("excel heads is "+str.toString());
        }
    }

	public static void main(String[] args) {
		// TODO Auto-generated method stub

	}
    /*private static List<String> getXssfHeader2(String file) throws IOException{
        log.info("begin getXssfHeader process:");
        long time = System.currentTimeMillis();
        Runtime run = Runtime.getRuntime();
        long max1 = run.maxMemory();
        long total1 = run.totalMemory();
        long free1 = run.freeMemory();
        long usable1 = max1 - total1 + free1;
        log.info("最大内存 = " + max1/1024/1024+"M");
        log.info("最大可用内存 = " + usable1/1024/1024+"M");
        List<String> heads=new ArrayList<String>();
        XSSFWorkbook wb=new XSSFWorkbook(MongoProvider.getFileStreamById(file));
        log.info("getXssfHeader read file:::::"+file+"  "+wb);
        XSSFSheet sheet = wb.getSheetAt(0);
        int rows = sheet.getPhysicalNumberOfRows();
        if(rows>0){
            XSSFRow row=sheet.getRow(0);
            log.info("getXssfHeader row:::::"+row);
            if(row!=null){
                int cells=row.getPhysicalNumberOfCells();
                log.info("getXssfHeader cells:::::"+cells);
                for (int i = 0; i < cells; i++) {
                    XSSFCell cell=row.getCell(i);
                    String value=cell.getStringCellValue()==null?"":cell.getStringCellValue().trim();
                    heads.add(value);
                }
            }
        }
        long duration = System.currentTimeMillis() - time;
        String msg = String.format("%s消耗时间[%d ms]", "parse sheet", duration);
        log.info(msg);
        return heads;
    }*/
}
