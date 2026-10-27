package com.m7.cc.asterisk.cdr.server;

import java.io.File;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.ArrayList;
import java.util.List;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.mongodb.BasicDBList;
import com.mongodb.BasicDBObject;
import com.mongodb.DBCollection;
import com.mongodb.DBCursor;
import com.mongodb.DBObject;
import com.mongodb.gridfs.GridFS;
import com.mongodb.gridfs.GridFSDBFile;
import com.mongodb.gridfs.GridFSInputFile;

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

	public static long count(String collectionName, DBObject map) {
		try {
			DBCollection collection = MongoConnect.getInstance().getDB()
					.getCollection(collectionName);
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

	public static void insert(String collectionName, DBObject map) {
		try {
			DBCollection collection = MongoConnect.getInstance().getDB()
					.getCollection(collectionName);
			collection.insert(map);
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}
	}

	public static void update(String collectionName, DBObject condition,
			DBObject doc) {
		try {
			DBCollection collection = MongoConnect.getInstance().getDB()
					.getCollection(collectionName);
			collection.update(condition, doc);
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}
	}
	
	public static void update(String collectionName, DBObject condition,
			DBObject doc, boolean multi) {
		try {
			DBCollection collection = MongoConnect.getInstance().getDB()
					.getCollection(collectionName);
			collection.update(condition, doc, false, multi);
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}
	}
	
	public static void update(String collectionName, DBObject condition,
			DBObject doc, boolean upsert, boolean multi) {
		try {
			DBCollection collection = MongoConnect.getInstance().getDB()
					.getCollection(collectionName);
			collection.update(condition, doc, upsert, multi);
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}
	}

	public static void remove(String collectionName, DBObject condition) {
		try {
			DBCollection collection = MongoConnect.getInstance().getDB()
					.getCollection(collectionName);
			collection.remove(condition);
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}
	}

	public static List<DBObject> find(String collectionName, DBObject condition) {
		List<DBObject> map = new ArrayList<DBObject>();
		try {
			DBCollection collection = MongoConnect.getInstance().getDB()
					.getCollection(collectionName);
			DBCursor result = collection.find(condition);
			while (result.hasNext()) {
				DBObject ob = result.next();
				map.add(ob);
			}
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}
		return map;
	}

	public static List<DBObject> find(String collectionName,
			DBObject condition, DBObject keys) {
		List<DBObject> map = new ArrayList<DBObject>();
		try {
			DBCollection collection = MongoConnect.getInstance().getDB()
					.getCollection(collectionName);
			DBCursor result = collection.find(condition, keys);
			while (result.hasNext()) {
				DBObject ob = result.next();
				map.add(ob);
			}
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}
		return map;
	}
	
	public static List<DBObject> group(String collectionName, 
			DBObject condition, DBObject keys, 
			DBObject initial, String reduceString) {
		List<DBObject> map = new ArrayList<DBObject>();
		try {
			DBCollection collection = MongoConnect.getInstance().getDB()
					.getCollection(collectionName);
			BasicDBList result = (BasicDBList)collection.group(keys, condition , initial, reduceString);
			for(int i = 0; i < result.size(); i++) {
				DBObject ob = (DBObject)result.get(i);
				map.add(ob);
			}
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}
		return map;
	}

	public static DBCollection getConection(String collectionName) {
		DBCollection collection = MongoConnect.getInstance().getDB()
				.getCollection(collectionName);
		return collection;
	}

	public static boolean saveUserPic(String filename, String file, String account) {
		try {
			GridFS gfs = new GridFS(MongoConnect.getInstance().getDB(), PIC);
			GridFSInputFile input = gfs.createFile(file);
			input.setFilename(filename);
			input.put("account", account);
			input.put("lastupdate", System.currentTimeMillis());
			input.save();
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
			return false;
		}
		return true;
	}

	public static boolean saveUserPic(String filename, File file, String account) {
		try {
			GridFS gfs = new GridFS(MongoConnect.getInstance().getDB(), PIC);
			GridFSInputFile input = gfs.createFile(file);
			input.setFilename(filename);
			input.put("account", account);
			input.put("lastupdate", System.currentTimeMillis());
			input.save();
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
			return false;
		}
		return true;
	}
	
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

	public static void getPicStream(String account, String filename, OutputStream out) {
		try {
			GridFS gfs = new GridFS(MongoConnect.getInstance().getDB(), PIC);
			DBObject con = new BasicDBObject();
			con.put("account", account);
			con.put("filename", filename);
			GridFSDBFile output = gfs.findOne(con);
			output.writeTo(out);
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}
	}

	public static void deletePic(String account, String filename) {
		try {
			GridFS gfs = new GridFS(MongoConnect.getInstance().getDB(), PIC);
			DBObject con = new BasicDBObject();
			con.put("account", account);
			con.put("filename", filename);
			gfs.remove(con);
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}
	}

	public static void deletePic(DBObject doc) {
		try {
			GridFS gfs = new GridFS(MongoConnect.getInstance().getDB(), PIC);
			gfs.remove(doc);
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}
	}
	
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

	public static boolean saveFile(String account, String filename, File file, String collection) {
		try {
			GridFS gfs = new GridFS(MongoConnect.getInstance().getDB(), collection);
			GridFSInputFile input = gfs.createFile(file);
			input.setFilename(filename);
			input.put("account", account);
			input.put("lastupdate", System.currentTimeMillis());
			input.save();
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
			return false;
		}
		return true;
	}

	public static boolean saveFile(String account, String filename, InputStream in, String collection) {
		try {
			GridFS gfs = new GridFS(MongoConnect.getInstance().getDB(), collection);
			GridFSInputFile input = gfs.createFile(in);
			input.setFilename(filename);
			input.put("account", account);
			input.put("lastupdate", System.currentTimeMillis());
			input.save();
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
			return false;
		}
		return true;
	}

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

	public static void getFileStream(String account, String filename, OutputStream out, String colletion) {
		try {
			GridFS gfs = new GridFS(MongoConnect.getInstance().getDB(), colletion);
			DBObject con = new BasicDBObject();
			con.put("account", account);
			con.put("filename", filename);
			GridFSDBFile output = gfs.findOne(con);
			output.writeTo(out);
		} catch (Exception e) {
//			log.log(Level.WARNING, "", e);
		}
	}

	public static void deleteFile(String account, String filename, String colletion) {
		try {
			DBObject con = new BasicDBObject();
			con.put("account", account);
			con.put("filename", filename);
			GridFS gfs = new GridFS(MongoConnect.getInstance().getDB(), colletion);
			gfs.remove(con);
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}
	}
	
//	public static void deleteFile(DBObject doc, String collection) {
//		try {
//			GridFS gfs = new GridFS(MongoConnect.getInstance().getDB(), collection);
//			gfs.remove(doc);
//		} catch (Exception e) {
//			log.log(Level.WARNING, "", e);
//		}
//	}
}
