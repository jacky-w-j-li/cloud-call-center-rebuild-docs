package com.m7.cc.db.mongo;

import java.io.File;
import java.util.ArrayList;
import java.util.List;

import com.m7.cc.util.Utils;
import com.mongodb.BasicDBObject;
import com.mongodb.DB;
import com.mongodb.DBCollection;
import com.mongodb.DBCursor;
import com.mongodb.DBObject;
import com.mongodb.Mongo;
import com.mongodb.MongoOptions;
import com.mongodb.gridfs.GridFS;
import com.mongodb.gridfs.GridFSDBFile;
import com.mongodb.gridfs.GridFSInputFile;

public class Copy_2_of_CountAliveAccount {

	public static void main(String[] args) {
		System.setProperty("MONGO.POOLSIZE", String.valueOf(10));
		try {
//			String ip = "115.29.10.194";  //测试
			String ip = "115.29.10.194"; //正式
			String port = "3210";
//			String user = "7moor";
//			String password = "7moorcom";
			if (ip == null || port == null) {
				System.out.println("Database not configured!!!!!");
				return;
			}
			System.out.println("Connecting to db: " + ip + ":" + port);
			Mongo mongo = new Mongo(ip, Integer.valueOf(port));
			MongoOptions options = mongo.getMongoOptions();
			options.autoConnectRetry = true;
			options.connectionsPerHost = 200;
//			DB db = mongo.getDB("admin");
//			db.authenticate(user, password.toCharArray());
			System.out.println("Connected to db: " + ip + ":" + port);
			
			String aip = "10.160.11.198"; //正式
			String aport = "7211";
			System.out.println("Connecting to product db: " + aip + ":" + aport);
			Mongo amongo = new Mongo(aip, Integer.valueOf(aport));
			MongoOptions aoptions = amongo.getMongoOptions();
			aoptions.autoConnectRetry = true;
			aoptions.connectionsPerHost = 200;
			DB adb = amongo.getDB("admin");
			String user = "7moor";
			String password = "7moorcom";
			adb.authenticate(user, password.toCharArray());
			System.out.println("Connected to product db: " + aip + ":" + aport);
			
			DB ccdb = mongo.getDB("cc");
			DBCollection collection = ccdb.getCollection("manager_ivr_sound");
			DBObject findcc = new BasicDBObject("IsQiniuMusic", null);
			DBCursor ccCur = collection.find(findcc);
			int count = 0;
			while (ccCur.hasNext()) {
				DBObject one = ccCur.next();
				if(one != null){
					String fileName = one.get("Filename").toString().replace(".wav", "");
					System.out.println(fileName);
					//init upload
					GridFS gridFS=null;  
				    adb = amongo.getDB("cc_file");
			        gridFS=new GridFS(adb);
			        List<GridFSDBFile> exitListfiles = gridFS.find(new BasicDBObject("_id",fileName));
			        if(exitListfiles.size() == 0){
			        	//init down
			        	DB db = mongo.getDB("cc_file");
			        	GridFS gridFs=null;  
			        	gridFs=new GridFS(db);     
			        	//查找条件  
			        	DBObject query=new BasicDBObject();
			        	query.put("_id", fileName);
			        	//查询的结果：  
			        	List<GridFSDBFile> listfiles=gridFs.find(query);  
			        	System.out.println(listfiles);
			        	if(listfiles.size() > 0){
			        		GridFSDBFile gridDBFile=listfiles.get(0);  
			        		//获得其中的文件名  
			        		//注意 ： 不是fs中的表的列名，而是根据调试gridDBFile中的属性而来  
			        		String dbfileName=(String)gridDBFile.get("filename");
			        		String date = Utils.getCurrentTimestamp();
			        		if(gridDBFile.get("metadata") != null){
			        			date = ((DBObject)gridDBFile.get("metadata")).get("date").toString();				    	
			        		}
			        		System.out.println("从Mongodb获得文件名为："+dbfileName + date);  
			        		
			        		File writeFile=new File("./"+dbfileName);  
			        		if(!writeFile.exists()){  
			        			writeFile.createNewFile();  
			        		}  
			        		//把数据写入磁盘中
			        		//查看相应的提示  
			        		gridDBFile.writeTo("./"+dbfileName);  
			        		//写入文件中  
			        		gridDBFile.writeTo(writeFile);
			        		System.out.println(dbfileName + " ---下载完成");
			        		
			        		//上传
			        		File readFile=new File("./"+dbfileName);
			        		if(readFile.exists()){
			        			GridFSInputFile  mongofile=gridFS.createFile(readFile);  
			        			//可以再添加属性
			        			mongofile.setId(fileName);
			        			mongofile.setFilename(dbfileName);
			        			mongofile.setContentType("binary/octet-stream");
			        			mongofile.put("metadata", new BasicDBObject("type","storage").append("date", date)); 
			        			//保存  
			        			mongofile.save();
			        			System.out.println(dbfileName + " ---上传完成");
			        			readFile.delete();
			        			System.out.println(dbfileName + " ---删除完成");			        	
			        		}else{
			        			System.out.println("未找打文件");
			        		}
			        	}
			        }else{
			        	System.out.println(fileName + "已存在----");
			        }
				}
				System.out.println("已处理 【"+count+"]个");
				count++;
			}
			System.out.println("bingo!!!!~~~~全部完成！！！yeah");
		} catch (Exception e) {
			System.out.println("Connect to mongodb failed");
			e.printStackTrace();
		}
	}
	
	 /**  
     * 存储文件  
     */  
     public static void saveFile() throws Exception{  
           
          //连接服务器  
          Mongo mongo=new Mongo();  
          //连接数据库  
          DB db=mongo.getDB("testGridFS");  
           
          //文件操作是在DB的基础上实现的，与表和文档没有关系  
          GridFS gridFS=null;  
          gridFS=new GridFS(db);  
           
          String fileName="vltest.log";  
          File readFile=new File("d:/"+fileName);  
           
          GridFSInputFile  mongofile=gridFS.createFile(readFile);  
        //可以再添加属性  
          mongofile.put("path","d:/"+fileName);  
          //保存  
          mongofile.save();           
     }  
      
     /**  
     * 读文件，读到磁盘上  
     * @throws Exception  
     */  
     public static void readFile() throws Exception{  
          //链接服务器  
          Mongo mongo=new Mongo();  
          //连接数据库  
          DB db=mongo.getDB("testGridFS");  
          GridFS gridFs=null;  
          gridFs=new GridFS(db);  
           
          //查找条件  
          DBObject query=new BasicDBObject();  
        //查询的结果：  
          List<GridFSDBFile> listfiles=gridFs.find(query);  
        GridFSDBFile gridDBFile=listfiles.get(0);  
         
        //获得其中的文件名  
        //注意 ： 不是fs中的表的列名，而是根据调试gridDBFile中的属性而来  
        String fileName=(String)gridDBFile.get("filename");  
         
        System.out.println("从Mongodb获得文件名为："+fileName);  
          
        File writeFile=new File("d:/"+fileName);  
        if(!writeFile.exists()){  
             writeFile.createNewFile();  
          }  
         
        //把数据写入磁盘中  
        //查看相应的提示  
        gridDBFile.writeTo("d:/a.txt");  
        //写入文件中  
        gridDBFile.writeTo(writeFile);         
         
     }  

}
