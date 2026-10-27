package com.dishui.util.excel;

import com.dishui.db.mango.MongoConnect;
import com.dishui.model.ExportModelVo;
import com.mongodb.BasicDBObject;
import com.mongodb.DBCollection;
import com.mongodb.DBCursor;
import com.mongodb.DBObject;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.logging.Logger;

public class TestDataExport extends XssfWriter {
	private static Logger log = Logger.getLogger(TestDataExport.class.getName());

	@Override
	public void generate(Map<String,Object> query) throws Exception {
	    //电子表格开始
        beginSheet();
        int rownum = 0;
        long   num=18100000000l;
        for (long i = num; i < 18100200000l; i++) {
            insertRow(rownum);
            createCell(0,i);
            endRow();
            rownum++;
        }

        //电子表格结束
        endSheet();
	}




    public static void main(String[] args) {
       /* System.out.println("TestDataExport");
        new Thread(new B("TestDataExport0")).start();
        new Thread(new B("TestDataExport1")).start();
        new Thread(new B("TestDataExport2")).start();
        new Thread(new B("TestDataExport3")).start();
        try
        {
            Thread.sleep(5000);
        }
        catch(InterruptedException e)
        {
            e.printStackTrace();
        }
        Thread current = Thread.currentThread();
        System.out.println(current.getPriority());
        System.out.println(current.getName());
        System.out.println(current.activeCount());
        System.out.println(current.getId());
        System.out.println(current.getThreadGroup());
        System.out.println(current.getStackTrace());
        System.out.println(current.hashCode());
        System.out.println(current.toString());
*/
        XssfWriter writer = new TestDataExport();
        Map<String, Object> query = new HashMap<String, Object>();
        query.put("handlerType","testData");
        try{
            writer.process("customerExport", query);
        }catch (Exception e){
            e.printStackTrace();
        }

    }
}

class B implements Runnable
{
    private int num=0;
    private String name;
    public B(String s)
    {
        this.name = s;
    }
    public void run()
    {
        System.out.println(this.name);
        try
        {
            Thread.sleep(1000);
        }
        catch (InterruptedException e)
        {
            e.printStackTrace();
        }
    }
}