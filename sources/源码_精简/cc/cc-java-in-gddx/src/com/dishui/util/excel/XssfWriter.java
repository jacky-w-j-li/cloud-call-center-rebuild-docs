package com.dishui.util.excel;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.Writer;
import java.text.SimpleDateFormat;
import java.util.*;
import java.util.zip.ZipEntry;
import java.util.zip.ZipFile;
import java.util.zip.ZipOutputStream;

import com.dishui.model.ExportModelVo;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.ss.util.CellReference;
import org.apache.poi.xssf.streaming.SXSSFWorkbook;

import com.dishui.manager.service.AppConfig;
import com.dishui.manager.service.Utils;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;


/**
 * 抽象excel2007读入器，先构建.xlsx一张模板，改写模板中的sheet.xml,使用这种方法
 * 写入.xlsx文件，不需要太大的内存
 *
 */
public abstract class XssfWriter {
	private static final String XML_ENCODING = "UTF-8";
	private SpreadsheetWriter sw;
    private SXSSFWorkbook wb;
    private Sheet sheet;
    private Row row;
    private CellStyle defalutStyle;

	/**
	 * 写入电子表格的主要流程
	 * @throws Exception
	 */
	public String process(String fileDesc,Map<String,Object> query) throws Exception{
		String handlerType=query.get("handlerType").toString();
		String dir = AppConfig.getInstance().getVar("export.dir")+handlerType+"/";
		query.remove("handlerType");
		File directory = new File(dir);
		if (!directory.exists()) {
			directory.mkdirs();
		}
        wb = new SXSSFWorkbook(2000);
//        wb.setCompressTempFiles(false); //不进行压缩
        defalutStyle = wb.createCellStyle();
        DataFormat dataformat = wb.createDataFormat();
        defalutStyle.setDataFormat(dataformat.getFormat("@"));



		generate(query);

        SimpleDateFormat format = new SimpleDateFormat("yyyy-MM-dd HH-mm-ss");
        String date= format.format(new Date());
        String fileName = fileDesc+date+".xlsx";
        String trueName=Utils.getUniqueid()+".xlsx";
        String path=dir+trueName;
        System.out.println(path);
        File file = new File(path);
        file.createNewFile();


		FileOutputStream out = new FileOutputStream(file);
        wb.write(out);
		out.close();
        wb.dispose();

		return fileName+"|"+trueName;
	}

	/**
	 * 类使用者应该使用此方法进行写操作
	 * @throws Exception
	 */
	public abstract void generate(Map<String,Object> query) throws Exception;
 

	public Sheet beginSheet() throws IOException {
        sheet = wb.createSheet("sheet1");
        return sheet;
	}

	public Row insertRow(int rowNum) throws IOException {
        row = sheet.createRow(rowNum);
        return row;
	}

	public Cell createCell(int columnIndex, String value) throws IOException {
        Cell cell = row.createCell(columnIndex);
        if(value == null){
            value = "";
        }
        cell.setCellValue(value);
        cell.setCellStyle(defalutStyle);
        return cell;
	}


	public Cell createCell(int columnIndex, double value) throws IOException {
        String stringValue = String.valueOf(value);
        return createCell(columnIndex,stringValue);
	}
	/**
	 * 合并单元格
	 * author jinjj
	 * @param firstRow
	 * @param lastRow
	 * @param firstCol
	 * @param lastCol
	 * @return 
	 */
	public void mergedCell(int firstRow, int lastRow, int firstCol, int lastCol){
		sheet.addMergedRegion(new CellRangeAddress(firstRow, lastRow, firstCol, lastCol));
		CellStyle mergedStyle = wb.createCellStyle();
		Cell cell = sheet.getRow(firstRow).getCell(firstCol);
		mergedStyle.cloneStyleFrom(defalutStyle);
		mergedStyle.setAlignment(CellStyle.ALIGN_CENTER);
		mergedStyle.setVerticalAlignment(CellStyle.VERTICAL_CENTER);
		cell.setCellStyle(mergedStyle);
	}
	/**
	 * 合并单元格,左对齐
	 * author jinjj
	 * @param firstRow
	 * @param lastRow
	 * @param firstCol
	 * @param lastCol
	 * @return 
	 */
	public void mergedCellNoStyle(int firstRow, int lastRow, int firstCol, int lastCol){
		sheet.addMergedRegion(new CellRangeAddress(firstRow, lastRow, firstCol, lastCol));
	}
	public void endRow() throws IOException {
	}

	public void endSheet() throws IOException {
	}

	/**
	 *
	 * @param zipfile the template file
	 * @param tmpfile the XML file with the sheet data
	 * @param entry the name of the sheet entry to substitute, e.g. xl/worksheets/sheet1.xml
	 * @param out the stream to write the result to
	 */
	private static void substitute(File zipfile, File tmpfile, String entry,
			OutputStream out) throws IOException {
		ZipFile zip = new ZipFile(zipfile);
		ZipOutputStream zos = new ZipOutputStream(out);

		@SuppressWarnings("unchecked")
		Enumeration<ZipEntry> en = (Enumeration<ZipEntry>) zip.entries();
		while (en.hasMoreElements()) {
			ZipEntry ze = en.nextElement();
			if (!ze.getName().equals(entry)) {
				zos.putNextEntry(new ZipEntry(ze.getName()));
				InputStream is = zip.getInputStream(ze);
				copyStream(is, zos);
				is.close();
			}
		}
		zos.putNextEntry(new ZipEntry(entry));
		InputStream is = new FileInputStream(tmpfile);
		copyStream(is, zos);
		is.close();
		zos.close();
	}

	private static void copyStream(InputStream in, OutputStream out)
			throws IOException {
		byte[] chunk = new byte[1024];
		int count;
		while ((count = in.read(chunk)) >= 0) {
			out.write(chunk, 0, count);
		}
	}

	/**
	 * 在写入器中写入电子表格
	 * 
	 */
	public static class SpreadsheetWriter {
		private final Writer _out;
		private int _rownum;
		private static String LINE_SEPARATOR = System.getProperty("line.separator");

		public SpreadsheetWriter(Writer out) {
			_out = out;
		}

		public void beginSheet() throws IOException {
			_out.write("<?xml version=\"1.0\" encoding=\""+XML_ENCODING+"\"?>"
							+ "<worksheet xmlns=\"http://schemas.openxmlformats.org/spreadsheetml/2006/main\">");
			_out.write("<sheetData>"+LINE_SEPARATOR);
		}

		public void endSheet() throws IOException {
			_out.write("</sheetData>");
			_out.write("</worksheet>");
		}

		/**
		 * 插入新行
		 *
		 * @param rownum 以0开始
		 */
		public void insertRow(int rownum) throws IOException {
			_out.write("<row r=\"" + (rownum + 1) + "\">"+LINE_SEPARATOR);
			this._rownum = rownum;
		}

		/**
		 * 插入行结束标志
		 */
		public void endRow() throws IOException {
			_out.write("</row>"+LINE_SEPARATOR);
		}

		/**
		 * 插入新列
		 * @param columnIndex
		 * @param value
		 * @param styleIndex
		 * @throws java.io.IOException
		 */
		public void createCell(int columnIndex, String value, int styleIndex)
				throws IOException {
			String ref = new CellReference(_rownum, columnIndex)
					.formatAsString();
			_out.write("<c r=\"" + ref + "\" t=\"inlineStr\"");
			if (styleIndex != -1)
				_out.write(" s=\"" + styleIndex + "\"");
			_out.write(">");
			_out.write("<is><t>"+XMLEncoder.encode(value)+"</t></is>");
			_out.write("</c>");
		}

		public void createCell(int columnIndex, String value)
				throws IOException {
			createCell(columnIndex, value, -1);
		}

		public void createCell(int columnIndex, double value, int styleIndex)
				throws IOException {
			String ref = new CellReference(_rownum, columnIndex)
					.formatAsString();
			_out.write("<c r=\"" + ref + "\" t=\"n\"");
			if (styleIndex != -1)
				_out.write(" s=\"" + styleIndex + "\"");
			_out.write(">");
			_out.write("<v>" + value + "</v>");
			_out.write("</c>");
		}

		public void createCell(int columnIndex, double value)
				throws IOException {
			createCell(columnIndex, value, -1);
		}

		public void createCell(int columnIndex, Calendar value, int styleIndex)
				throws IOException {
			createCell(columnIndex, DateUtil.getExcelDate(value, false),
					styleIndex);
		}
	}
	public static void main(String[] args) {
//		// TODO Auto-generated method stub
//		System.out.println("............................");
//    	Runtime run = Runtime.getRuntime(); 
//		long start = System.currentTimeMillis();
//		//构建excel2007写入器
//		XssfWriter excel07Writer = new XssfWriter();
//		//调用处理方法
//		try {
//			excel07Writer.process("/Users/hotchwong/Desktop/test07.xlsx");
//		} catch (Exception e) {
//			// TODO Auto-generated catch block
//			e.printStackTrace();
//		}
//		long max = run.maxMemory(); 
//		long total = run.totalMemory(); 
//		long free = run.freeMemory(); 
//		long usable = max - total + free; 
//		System.out.println("最大内存 = " + max/1024/1024+"M"); 
//		System.out.println("最大可用内存 = " + usable/1024/1024+"M");	
//		
//		long end = System.currentTimeMillis();
//		System.out.println(".............消耗........"+(end-start));
	}
}