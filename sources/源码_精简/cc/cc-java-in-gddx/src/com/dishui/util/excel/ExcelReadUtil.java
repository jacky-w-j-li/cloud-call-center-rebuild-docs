package com.dishui.util.excel;

import com.dishui.manager.command.Fields;

import java.io.IOException;


public class ExcelReadUtil {
	
	public static void process(RowHandler rowHandler,String fileId,String fileName){
		try {
			if (fileName.endsWith(Fields.EXTENSION_03)){
				HssfEventHandler hssf = new HssfEventHandler();
				hssf.setRowHandler(rowHandler);
				hssf.process(fileId);
			} else if (fileName.endsWith(Fields.EXTENSION_07)){
				XssfEventHandler xssf = new XssfEventHandler();
				xssf.setRowHandler(rowHandler);
				xssf.processAllSheets(fileId);
			} else {
				throw new  Exception("文件格式错误,扩展名只能是xls或xlsx.");
			}
		} catch (IOException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		} catch (Exception e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
	}


    public static void processCustomer(RowHandler rowHandler,String fileId,String fileName){
        try {
            if (fileName.endsWith(Fields.EXTENSION_03)){
                HssfEventHandler2 hssf = new HssfEventHandler2();
                hssf.setRowHandler(rowHandler);
                hssf.process(fileId);
            } else if (fileName.endsWith(Fields.EXTENSION_07)){
                XssfEventHandler2 xssf = new XssfEventHandler2();
                xssf.setRowHandler(rowHandler);
                xssf.processAllSheets(fileId);
            } else {
                throw new  Exception("文件格式错误,扩展名只能是xls或xlsx.");
            }
        } catch (IOException e) {
            // TODO Auto-generated catch block
            e.printStackTrace();
        } catch (Exception e) {
            // TODO Auto-generated catch block
            e.printStackTrace();
        }
    }
}
