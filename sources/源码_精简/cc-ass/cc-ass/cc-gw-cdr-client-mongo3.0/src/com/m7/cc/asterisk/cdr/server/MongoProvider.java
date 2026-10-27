package com.m7.cc.asterisk.cdr.server;

import java.util.ArrayList;
import java.util.List;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;
import com.mongodb.client.FindIterable;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoCursor;
import com.mongodb.client.model.UpdateOptions;

public class MongoProvider {

	public static final String USER = "c5user";
	public static final String GROUP = "c5group";
	public static final String AUTHKEY = "authkey";
	public static final String MESSAGE = "message";
	public static final String PIC = "userpic";
	public static final String PIC_DIR = "./";
	public static final String ATTACHEMENT = "attachement";
	public static final String SMAMIL_FILE = "smailfile";
	public static final String MSG_TEMP_FILE = "msgtempfile";
	public static final String CALENDAR = "calendar";
	public static final String CONFERENCE = "conference";
	public static final String DEPARTMENT = "department";
	public static final String CHAT_SESSION = "chatsession";
	public static final String NOTIFY = "notify";
	public static final String PMAIL = "pmail";
	public static final String PMailReply = "pmailreply";
	public static final String SMAIL = "smail";
	public static final String SMAIL_REPLY = "smailreply";
	public static final String SESSION_FILE = "seeionfile";
	public static final String KNOWLEDGE = "knowledge";
	public static final String AERA = "area";
	public static final String MAILREMIND = "mailremind";
	public static final String WEIBOTOPIC = "weibotopic";
	public static final String VOTEHISTORY = "votehistory";
	public static final String SHAREFORDERFILES = "shareforder.files";
	public static final String ATTENCE = "attence";
	public static final String ATTENCE_INFO = "attenceinfo";
	public static final String ATTENCE_IP = "attenceip";
	public static final String ATTENCE_SPECIAL = "attencespecial";
	public static final String UPDATE_LOG = "uploadLog";
	
	private static Logger log = Logger.getLogger(MongoProvider.class.getName());

	public static long count(String collectionName, BasicDBObject map) {
		try {
			MongoCollection<BasicDBObject> collection = MongoConnect.getInstance().getDB().getCollection(collectionName, BasicDBObject.class);
			if (map == null) {
				return collection.count();
			} else {
				return collection.count(map);
			}
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}
		return 0;
	}

	public static void insert(String collectionName, BasicDBObject map) {
		try {
			MongoCollection<BasicDBObject> collection = MongoConnect.getInstance().getDB()
					.getCollection(collectionName, BasicDBObject.class);
			collection.insertOne(map);
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}
	}

	public static void update(String collectionName, BasicDBObject condition,
			BasicDBObject doc) {
		try {
			MongoCollection<BasicDBObject> collection = MongoConnect.getInstance().getDB()
					.getCollection(collectionName, BasicDBObject.class);
			collection.updateMany(condition, doc);
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}
	}
	
	public static void update(String collectionName, BasicDBObject condition,
			BasicDBObject doc, boolean multi) {
		try {
			MongoCollection<BasicDBObject> collection = MongoConnect.getInstance().getDB()
					.getCollection(collectionName, BasicDBObject.class);
			UpdateOptions uo = new UpdateOptions();
			uo.upsert(false);
			if(multi){
				collection.updateMany(condition, doc, uo);				
			}else{
				collection.updateOne(condition, doc, uo);
			}
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}
	}
	
	public static void update(String collectionName, BasicDBObject condition,
			BasicDBObject doc, boolean upsert, boolean multi) {
		try {
			MongoCollection<BasicDBObject> collection = MongoConnect.getInstance().getDB()
					.getCollection(collectionName, BasicDBObject.class);
			UpdateOptions uo = new UpdateOptions();
			uo.upsert(upsert);
			if(multi){
				collection.updateMany(condition, doc, uo);				
			}else{
				collection.updateOne(condition, doc, uo);
			}
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}
	}

	public static void remove(String collectionName, BasicDBObject condition) {
		try {
			MongoCollection<BasicDBObject> collection = MongoConnect.getInstance().getDB()
					.getCollection(collectionName, BasicDBObject.class);
			collection.deleteMany(condition);
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}
	}

	public static List<DBObject> find(String collectionName, BasicDBObject condition) {
		List<DBObject> map = new ArrayList<DBObject>();
		try {
			MongoCollection<BasicDBObject> collection = MongoConnect.getInstance().getDB()
					.getCollection(collectionName, BasicDBObject.class);
			FindIterable<BasicDBObject> iterable = collection.find(condition);
		    MongoCursor<BasicDBObject> cursor = iterable.iterator();
		    while (cursor.hasNext()) {
		    	BasicDBObject ob = cursor.next();
				map.add(ob);
			}
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}
		return map;
	}

	public static List<DBObject> find(String collectionName,
			BasicDBObject condition, BasicDBObject keys) {
		List<DBObject> map = new ArrayList<DBObject>();
		try {
			MongoCollection<BasicDBObject> collection = MongoConnect.getInstance().getDB()
					.getCollection(collectionName, BasicDBObject.class);
			FindIterable<BasicDBObject> iterable = collection.find(condition).projection(keys);
		    MongoCursor<BasicDBObject> cursor = iterable.iterator();
		    while (cursor.hasNext()) {
		    	BasicDBObject ob = cursor.next();
				map.add(ob);
			}
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}
		return map;
	}
	
//	public static List<DBObject> group(String collectionName, 
//			DBObject condition, DBObject keys, 
//			DBObject initial, String reduceString) {
//		List<DBObject> map = new ArrayList<DBObject>();
//		try {
//			MongoCollection<BasicDBObject> collection = MongoConnect.getInstance().getDB()
//					.getCollection(collectionName, BasicDBObject.class);
//			BasicDBList result = (BasicDBList)collection.group(keys, condition , initial, reduceString);
//			for(int i = 0; i < result.size(); i++) {
//				DBObject ob = (DBObject)result.get(i);
//				map.add(ob);
//			}
//		} catch (Exception e) {
//			log.log(Level.WARNING, "", e);
//		}
//		return map;
//	}

	public static MongoCollection<BasicDBObject> getConection(String collectionName) {
		MongoCollection<BasicDBObject> collection = MongoConnect.getInstance().getDB()
				.getCollection(collectionName, BasicDBObject.class);
		return collection;
	}
//
//	public static boolean saveUserPic(String filename, String file, String account) {
//		try {
//			GridFS gfs = new GridFS(MongoConnect.getInstance().getDB(), PIC);
//			GridFSInputFile input = gfs.createFile(file);
//			input.setFilename(filename);
//			input.put("account", account);
//			input.put("lastupdate", System.currentTimeMillis());
//			input.save();
//		} catch (Exception e) {
//			log.log(Level.WARNING, "", e);
//			return false;
//		}
//		return true;
//	}
//
//	public static boolean saveUserPic(String filename, File file, String account) {
//		try {
//			GridFS gfs = new GridFS(MongoConnect.getInstance().getDB(), PIC);
//			GridFSInputFile input = gfs.createFile(file);
//			input.setFilename(filename);
//			input.put("account", account);
//			input.put("lastupdate", System.currentTimeMillis());
//			input.save();
//		} catch (Exception e) {
//			log.log(Level.WARNING, "", e);
//			return false;
//		}
//		return true;
//	}
//	
//	public static boolean savePic(String filename, InputStream in) {
//		try {
//			GridFS gfs = new GridFS(MongoConnect.getInstance().getDB(), PIC);
//			GridFSInputFile input = gfs.createFile(in);
//			input.setFilename(filename);
//			input.save();
//		} catch (Exception e) {
//			log.log(Level.WARNING, "", e);
//			return false;
//		}
//		return true;
//	}

//	public static String getUserPic(String filename) {
//		try {
//			GridFS gfs = new GridFS(MongoConnect.getInstance().getDB(), PIC);
//			GridFSDBFile output = gfs.findOne(filename);
//			output.writeTo(PIC_DIR + filename);
//		} catch (Exception e) {
//			log.log(Level.WARNING, "", e);
//		}
//		return PIC_DIR + filename;
//	}

//	public static void getPicStream(String account, String filename, OutputStream out) {
//		try {
//			GridFS gfs = new GridFS(MongoConnect.getInstance().getDB(), PIC);
//			DBObject con = new BasicDBObject();
//			con.put("account", account);
//			con.put("filename", filename);
//			GridFSDBFile output = gfs.findOne(con);
//			output.writeTo(out);
//		} catch (Exception e) {
//			log.log(Level.WARNING, "", e);
//		}
//	}
//
//	public static void deletePic(String account, String filename) {
//		try {
//			GridFS gfs = new GridFS(MongoConnect.getInstance().getDB(), PIC);
//			DBObject con = new BasicDBObject();
//			con.put("account", account);
//			con.put("filename", filename);
//			gfs.remove(con);
//		} catch (Exception e) {
//			log.log(Level.WARNING, "", e);
//		}
//	}
//
//	public static void deletePic(DBObject doc) {
//		try {
//			GridFS gfs = new GridFS(MongoConnect.getInstance().getDB(), PIC);
//			gfs.remove(doc);
//		} catch (Exception e) {
//			log.log(Level.WARNING, "", e);
//		}
//	}
//	
	/**
	 * 
	 * @param filename
	 * @param file
	 * @return
	 */
//	public static boolean saveFile(String filename, String file, String collection) {
//		try {
//			GridFS gfs = new GridFS(MongoConnect.getInstance().getDB(), collection);
//			GridFSInputFile input = gfs.createFile(file);
//			input.setFilename(filename);
//			input.save();
//		} catch (Exception e) {
//			log.log(Level.WARNING, "", e);
//			return false;
//		}
//		return true;
//	}

//	public static boolean saveFile(String account, String filename, File file, String collection) {
//		try {
//			GridFS gfs = new GridFS(MongoConnect.getInstance().getDB(), collection);
//			GridFSInputFile input = gfs.createFile(file);
//			input.setFilename(filename);
//			input.put("account", account);
//			input.put("lastupdate", System.currentTimeMillis());
//			input.save();
//		} catch (Exception e) {
//			log.log(Level.WARNING, "", e);
//			return false;
//		}
//		return true;
//	}
//
//	public static boolean saveFile(String account, String filename, InputStream in, String collection) {
//		try {
//			GridFS gfs = new GridFS(MongoConnect.getInstance().getDB(), collection);
//			GridFSInputFile input = gfs.createFile(in);
//			input.setFilename(filename);
//			input.put("account", account);
//			input.put("lastupdate", System.currentTimeMillis());
//			input.save();
//		} catch (Exception e) {
//			log.log(Level.WARNING, "", e);
//			return false;
//		}
//		return true;
//	}

//	public static String getFile(String filename, String collection) {
//		try {
//			GridFS gfs = new GridFS(MongoConnect.getInstance().getDB(), collection);
//			GridFSDBFile output = gfs.findOne(filename);
//			output.writeTo(PIC_DIR + filename);
//		} catch (Exception e) {
//			log.log(Level.WARNING, "", e);
//		}
//		return PIC_DIR + filename;
//	}

//	public static void getFileStream(String account, String filename, OutputStream out, String colletion) {
//		try {
//			GridFS gfs = new GridFS(MongoConnect.getInstance().getDB(), colletion);
//			DBObject con = new BasicDBObject();
//			con.put("account", account);
//			con.put("filename", filename);
//			GridFSDBFile output = gfs.findOne(con);
//			output.writeTo(out);
//		} catch (Exception e) {
////			log.log(Level.WARNING, "", e);
//		}
//	}
//
//	public static void deleteFile(String account, String filename, String colletion) {
//		try {
//			DBObject con = new BasicDBObject();
//			con.put("account", account);
//			con.put("filename", filename);
//			GridFS gfs = new GridFS(MongoConnect.getInstance().getDB(), colletion);
//			gfs.remove(con);
//		} catch (Exception e) {
//			log.log(Level.WARNING, "", e);
//		}
//	}
	
//	public static void deleteFile(DBObject doc, String collection) {
//		try {
//			GridFS gfs = new GridFS(MongoConnect.getInstance().getDB(), collection);
//			gfs.remove(doc);
//		} catch (Exception e) {
//			log.log(Level.WARNING, "", e);
//		}
//	}
}
