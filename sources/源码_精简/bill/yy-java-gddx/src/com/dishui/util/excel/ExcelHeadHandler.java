package com.dishui.util.excel;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.logging.Logger;

import org.apache.poi.hssf.usermodel.HSSFCell;
import org.apache.poi.hssf.usermodel.HSSFRow;
import org.apache.poi.hssf.usermodel.HSSFSheet;
import org.apache.poi.hssf.usermodel.HSSFWorkbook;
import org.apache.poi.xssf.usermodel.XSSFCell;
import org.apache.poi.xssf.usermodel.XSSFRow;
import org.apache.poi.xssf.usermodel.XSSFSheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;

import com.dishui.db.mango.MongoProvider;
import com.dishui.bill.command.Fields;


public class ExcelHeadHandler {
	private static final Logger log = Logger.getLogger(ExcelHeadHandler.class.getName());
	public static List<String> process(String fileId,String fileName){
		try {
			if(fileName.endsWith(Fields.EXTENSION_03)){
				return getHssfHeader(fileId);
			}else if(fileName.endsWith(Fields.EXTENSION_07)){
				return getXssfHeader(fileId);
			}else{
				throw new  Exception("文件格式错误,扩展名只能是xls或xlsx.");
			}
		} catch (IOException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		} catch (Exception e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
		return null;
	}

	private static List<String> getXssfHeader(String file) throws IOException{
		List<String> heads=new ArrayList<String>();
		XSSFWorkbook wb=new XSSFWorkbook(MongoProvider.getFileStreamById(file));
		XSSFSheet sheet = wb.getSheetAt(0);
		int rows = sheet.getPhysicalNumberOfRows();
		if(rows>0){
			XSSFRow row=sheet.getRow(0);
			if(row!=null){
				int cells=row.getPhysicalNumberOfCells();
				for (int i = 0; i < cells; i++) {
					XSSFCell cell=row.getCell(i);
					String value=cell.getStringCellValue()==null?"":cell.getStringCellValue().trim();
					heads.add(value);
				}
			}
		}
		
		return heads;
	}
	private static List<String> getHssfHeader(String file) throws IOException{
		List<String> heads=new ArrayList<String>();
		HSSFWorkbook wb=new HSSFWorkbook(MongoProvider.getFileStreamById(file));
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
	public static void main(String[] args) {
		// TODO Auto-generated method stub

	}

}
