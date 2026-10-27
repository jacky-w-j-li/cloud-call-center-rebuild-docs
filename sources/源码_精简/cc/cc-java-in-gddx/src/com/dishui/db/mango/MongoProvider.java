package com.dishui.db.mango;

import java.io.File;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Iterator;
import java.util.List;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.dishui.util.AccountUtil;
import com.mongodb.*;
import com.mongodb.client.MongoCollection;
import com.mongodb.gridfs.GridFS;
import com.mongodb.gridfs.GridFSDBFile;
import com.mongodb.gridfs.GridFSInputFile;
import com.sun.star.i18n.AmPmValue;

public class MongoProvider {

//	public static final String USER = "c5user";
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
	public static final String CALL_SHEET = "callsheet";
	public static final String fileDB = "cc_file";
	public static final String fileDBCollection = "fs";
	
	private static Logger log = Logger.getLogger(MongoProvider.class.getName());
	
	public static CommandResult getDbStates(String dbName){
		try {
			return MongoConnect.getInstance().getDB(dbName).getStats();
		} catch (Exception e) {
			log.log(Level.WARNING,"",e);
		}
		return null;
	}
	
	public static DB getDb(String dbname){
		try{
			return MongoConnect.getInstance().getDB(dbname);
		} catch (Exception e){
			log.log(Level.WARNING,"",e);
		}
		return null;
	}
	
	public static List<DBObject> distinct(String collectionName,String key, DBObject con){
		List<DBObject> result = new ArrayList<DBObject>();
		try{
            DBCollection collection = MongoConnect.getInstance().getDB()
					.getCollection(collectionName);

			result = collection.distinct(key, con);
		}catch(Exception e){
			log.log(Level.WARNING, "", e);
		}
		return result;
	}

	public static List<DBObject> reportDistinct(String dbName, String collectionName,String key, DBObject con){
		List<DBObject> result = new ArrayList<DBObject>();
		try{
			DBCollection collection = MongoConnect.getInstance().getReportDB(dbName)
					.getCollection(collectionName);

			result = collection.distinct(key, con);
		}catch(Exception e){
			log.log(Level.WARNING, "", e);
		}
		return result;
	}

    public static List<DBObject> distinct(String collectionName,String key,DBObject con,String accountId){
        List<DBObject> map = new ArrayList<DBObject>();
        try{
            DBCollection collection = MongoConnect.getInstance().getDB(AccountUtil.getAccountDb(accountId)).getCollection(collectionName);
            map = collection.distinct(key, con);
        }catch (Exception e){
            log.log(Level.WARNING,"",e);
        }
        return map;
    }
	

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
	
	public static long count(String collectionName, DBObject map,String accountId) {
		try {
			DBCollection collection = MongoConnect.getInstance().getDB(AccountUtil.getAccountDb(accountId))
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

    public static long count(String dbName, String collectionName, DBObject map) {
        try {
            DBCollection collection = MongoConnect.getInstance().getDB(dbName)
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
	
	public static void insert(String collectionName, DBObject map,String accountId) {
		try {
			DBCollection collection = MongoConnect.getInstance().getDB(AccountUtil.getAccountDb(accountId))
					.getCollection(collectionName);
			collection.insert(map);
			
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}
	}

    public static void insert(String dbName, String collectionName, DBObject doc) {
        try {
            DBCollection collection = MongoConnect.getInstance().getDB(dbName)
                    .getCollection(collectionName);
            collection.insert(doc);
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
			DBObject doc,String accountId) {
		try {
			DBCollection collection = MongoConnect.getInstance().getDB(AccountUtil.getAccountDb(accountId))
					.getCollection(collectionName);
			collection.update(condition, doc);
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}
	}

    public static void updateByDB(String db,String collectionName, DBObject condition,
                                  DBObject doc) {
        try {
            DBCollection collection = MongoConnect.getInstance().getDB(db)
                    .getCollection(collectionName);
            collection.update(condition, doc);
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
	
	public static void remove(String collectionName, DBObject condition,String accountId) {
		try {
			DBCollection collection = MongoConnect.getInstance().getDB(AccountUtil.getAccountDb(accountId))
					.getCollection(collectionName);
			collection.remove(condition);
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}
	}

    public static void removeFromReportDb(String dbName, String collectionName, DBObject condition) {
        try {
            DBCollection collection = MongoConnect.getInstance().getReportDB(dbName).getCollection(collectionName);
            collection.remove(condition);
        } catch (Exception e) {
            log.log(Level.WARNING, "", e);
        }
    }
	public static void dropFromReportDb(String dbName, String collectionName) {
		try {
			DBCollection collection = MongoConnect.getInstance().getReportDB(dbName).getCollection(collectionName);
			collection.drop();
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
	
	public static List<DBObject> findAndSort(String collectionName, DBObject condition,DBObject sort) {
		List<DBObject> map = new ArrayList<DBObject>();
		try {
			DBCollection collection = MongoConnect.getInstance().getDB()
					.getCollection(collectionName);
			DBCursor result = collection.find(condition);
			result = result.sort(sort);
			while (result.hasNext()) {
				DBObject ob = result.next();
				map.add(ob);
			}
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}
		return map;
	}
	
    public static List<DBObject> findFromReportDb(String collectionName, DBObject condition) {
        List<DBObject> map = new ArrayList<DBObject>();
        try {
            DBCollection collection = MongoConnect.getInstance().getReportDB()
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

    public static List<DBObject> findFromReportDb(String dbName, String collectionName, DBObject condition) {
        List<DBObject> map = new ArrayList<DBObject>();
        try {
            DBCollection collection = MongoConnect.getInstance().getReportDB(dbName).getCollection(collectionName);
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

    public static List<DBObject> findFromReportDb(String dbName, String collectionName, DBObject condition, DBObject sort, int limit) {
        List<DBObject> map = new ArrayList<DBObject>();
        try {
            DBCollection collection = MongoConnect.getInstance().getReportDB(dbName).getCollection(collectionName);
            DBCursor result = collection.find(condition).sort(sort).limit(limit);
            while (result.hasNext()) {
                DBObject ob = result.next();
                map.add(ob);
            }
        } catch (Exception e) {
            log.log(Level.WARNING, "", e);
        }
        return map;
    }

	public static List<DBObject> findFromReportDb(String dbName, String collectionName, DBObject condition, DBObject sort) {
		List<DBObject> map = new ArrayList<DBObject>();
		try {
			DBCollection collection = MongoConnect.getInstance().getReportDB(dbName).getCollection(collectionName);
			DBCursor result = collection.find(condition).sort(sort);
			while (result.hasNext()) {
				DBObject ob = result.next();
				map.add(ob);
			}
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}
		return map;
	}

    public static DBObject findOneFromReportDb(String dbName, String collectionName, DBObject condition) {
        DBObject doc = new BasicDBObject();
        try {
            DBCollection collection = MongoConnect.getInstance().getReportDB(dbName).getCollection(collectionName);
            doc = collection.findOne(condition);
        } catch (Exception e) {
            log.log(Level.WARNING, "", e);
        }
        return doc;
    }

    public static List<DBObject> aggregateFromReportDb(String collectionName  , DBObject match , DBObject group , DBObject sort){
        List<DBObject> map = new ArrayList<DBObject>();
        try{
            DBCollection collection = MongoConnect.getInstance().getReportDB().getCollection(collectionName);
            AggregationOutput output = collection.aggregate(match, group ,sort);
            Iterator<DBObject> results = output.results().iterator();
            while (results.hasNext()){
                DBObject ob = results.next();
                map.add(ob);
            }
        } catch (Exception e){
            log.log(Level.WARNING, "", e);
        }
        return map;
    }

    public static List<DBObject> find(String dbName,String collectionName,DBObject condition){
        List<DBObject> map = new ArrayList<DBObject>();
        try {
            DBCollection collection =  MongoConnect.getInstance().getDB(dbName).getCollection(collectionName);
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

    public static List<DBObject> find(String dbName,String collectionName,DBObject condition,DBObject returnFields){
        List<DBObject> map = new ArrayList<DBObject>();
        try {
            DBCollection collection =  MongoConnect.getInstance().getDB(dbName).getCollection(collectionName);
            DBCursor result = collection.find(condition, returnFields);
            while (result.hasNext()) {
                DBObject ob = result.next();
                map.add(ob);
            }
        } catch (Exception e) {
            log.log(Level.WARNING, "", e);
        }
        return map;
    }

	public static List<DBObject> find(String collectionName, DBObject condition,String accountId) {
		List<DBObject> map = new ArrayList<DBObject>();
		try {
			DBCollection collection = MongoConnect.getInstance().getDB(AccountUtil.getAccountDb(accountId))
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

	public static List<DBObject> find(String collectionName, DBObject condition,String accountId,DBObject returnFields) {
		List<DBObject> map = new ArrayList<DBObject>();
		try {
			DBCollection collection = MongoConnect.getInstance().getDB(AccountUtil.getAccountDb(accountId))
					.getCollection(collectionName);
			DBCursor result = collection.find(condition,returnFields);
			while (result.hasNext()) {
				DBObject ob = result.next();
				map.add(ob);
			}
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}
		return map;
	}

	public static List<DBObject> find(String collectionName, DBObject condition,String accountId,DBObject sort,DBObject returnFields) {
		List<DBObject> map = new ArrayList<DBObject>();
		try {
			DBCollection collection = MongoConnect.getInstance().getDB()
					.getCollection(collectionName);
			if(accountId!= null){
				collection = MongoConnect.getInstance().getDB(AccountUtil.getAccountDb(accountId))
						.getCollection(collectionName);
			}
			DBCursor result = null;
			if(returnFields != null){
				result = collection.find(condition,returnFields).sort(sort);
			}else{
				result = collection.find(condition).sort(sort);
			}

			while (result.hasNext()) {
				DBObject ob = result.next();
				map.add(ob);
			}
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}
		return map;
	}

    public static List<DBObject> find(String collectionName, DBObject condition, DBObject returnFields , String accountId ,int limit) {
        List<DBObject> map = new ArrayList<DBObject>();
        try {
            DBCollection collection = MongoConnect.getInstance().getDB(AccountUtil.getAccountDb(accountId))
                    .getCollection(collectionName);
            DBCursor result = collection.find(condition , returnFields).limit(limit);
            while (result.hasNext()) {
                DBObject ob = result.next();
                map.add(ob);
            }
        } catch (Exception e) {
            log.log(Level.WARNING, "", e);
        }
        return map;
    }
	public static DBObject findOne(String collectionName,DBObject condition){
		DBObject result = null;
		try {
			DBCollection collection = MongoConnect.getInstance().getDB()
					.getCollection(collectionName);
			result = collection.findOne(condition);
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}
		return result;
	}
	
	public static DBObject findOne(String collectionName,DBObject condition,String accountId){
		DBObject result = null;
		try {
			DBCollection collection = MongoConnect.getInstance().getDB(AccountUtil.getAccountDb(accountId))
					.getCollection(collectionName);
			result = collection.findOne(condition);
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}
		return result;
	}
	
	public static DBObject findOne(String dbName,String collectionName,DBObject condition){
		DBObject result = null;
		try {
			DBCollection collection =  MongoConnect.getInstance().getDB(dbName).getCollection(collectionName);
			result = collection.findOne(condition);
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}
		return result;
	}
	
	
	
	public static DBObject findAndModify(String collectionName,DBObject condition,DBObject udpate,boolean upsert){
		DBObject result = null;
		try {
			DBCollection collection = MongoConnect.getInstance().getDB()
					.getCollection(collectionName);
			result = collection.findAndModify(condition, null, null, false, udpate, true, upsert);
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}
		return result;
	}
	
	public static DBObject findAndModify(String collectionName,DBObject condition,DBObject udpate,boolean upsert,String accountId){
		DBObject result = null;
		try {
			DBCollection collection = MongoConnect.getInstance().getDB(AccountUtil.getAccountDb(accountId))
					.getCollection(collectionName);
			result = collection.findAndModify(condition, null, null, false, udpate, true, upsert);
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}
		return result;
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
	
	public static List<DBObject> find(String collectionName,
			DBObject condition, DBObject keys,String accountId) {
		List<DBObject> map = new ArrayList<DBObject>();
		try {
			DBCollection collection = MongoConnect.getInstance().getDB(AccountUtil.getAccountDb(accountId))
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
	
	public static InputStream getFileStreamById (String fileId){
		try {
			GridFS gfs = new GridFS(MongoConnect.getInstance().getDB(fileDB), fileDBCollection);
			DBObject con = new BasicDBObject();
			con.put("_id", fileId);
			GridFSDBFile output = gfs.findOne(con);
			return  output.getInputStream();
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
			return null;
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
	public static void batchInsert(String collectionName, List<DBObject> list) {
		try {
			DBCollection collection = MongoConnect.getInstance().getDB()
					.getCollection(collectionName);
			collection.insert(list);//WriteConcern.FSYNC_SAFE

		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}
	}

    public static void reportBatchInsert(String collectionName , List<DBObject> list){
        try {
            DBCollection collection = MongoConnect.getInstance().getReportDB()
                    .getCollection(collectionName);
            collection.insert(list);//WriteConcern.FSYNC_SAFE

        } catch (Exception e) {
            log.log(Level.WARNING, "", e);
        }
    }

	public static void reportBatchInsert(String dbName, String collectionName , List<DBObject> list, WriteConcern concern){
		try {
			DB reportDB = MongoConnect.getInstance().getReportDB(dbName);
			DBCollection collection = reportDB.getCollection(collectionName);

			WriteResult ret = collection.insert(list);//WriteConcern.FSYNC_SAFE


		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}
	}

    public static void reportInsert(String dbName, String collectionName , DBObject doc){
        try {
            DBCollection collection = MongoConnect.getInstance().getReportDB(dbName)
                    .getCollection(collectionName);
            collection.insert(doc);//WriteConcern.FSYNC_SAFE

        } catch (Exception e) {
            log.log(Level.WARNING, "", e);
        }
    }

    public static void batchInsert(String dbName, String collectionName, List<DBObject> list) {
        try {
//            DB db=MongoConnect.getInstance().getDB(dbName);
//            db.requestStart();
            DBCollection collection = MongoConnect.getInstance().getDB(dbName)
                    .getCollection(collectionName);
            collection.insert(list);
//            WriteResult ret =collection.insert(list,WriteConcern.FSYNC_SAFE);
//            if(!ret.getLastError().ok()){
//                log.log(Level.WARNING, "mongdb update failed! getLastError = " + ret.getLastError().getErrorMessage());
//            }
//            db.requestDone();
        } catch (Exception e) {
            log.log(Level.WARNING, "", e);
        }
    }
	
	public static void batchInsert(String collectionName, List<DBObject> list,String accountId) {
		try {
			DBCollection collection = MongoConnect.getInstance().getDB(AccountUtil.getAccountDb(accountId))
					.getCollection(collectionName);
			collection.insert(list);

		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}
	}

	public static String getAccountDB(String accountId){
		try {
			DBObject data=MongoProvider.findOne("bill","platform_account_product", new BasicDBObject("_id",accountId+"_cc"));
			String db=data.get("dataDB").toString();
			return db;
		} catch (Exception e) {
			e.printStackTrace();
			log.log(Level.WARNING, "", e);
		}
		return null;
	}

    public static void batchUpdate(String collectionName, DBObject condition,DBObject doc,String accountId) {
        try {
            DBCollection collection = MongoConnect.getInstance().getDB(AccountUtil.getAccountDb(accountId))
                    .getCollection(collectionName);
            collection.update(condition, doc,false,true);
        } catch (Exception e) {
            log.log(Level.WARNING, "", e);
        }
    }
    public static void batchUpdate(String collectionName, DBObject condition,DBObject doc) {
        try {
            DBCollection collection = MongoConnect.getInstance().getDB()
                    .getCollection(collectionName);
            collection.update(condition, doc,false,true);
        } catch (Exception e) {
            log.log(Level.WARNING, "", e);
        }
    }
    public static void writeFileStreamById (String fileId,File file){
        try {
            GridFS gfs = new GridFS(MongoConnect.getInstance().getDB(fileDB), fileDBCollection);
            DBObject con = new BasicDBObject();
            con.put("_id", fileId);
            GridFSDBFile output = gfs.findOne(con);
            output.writeTo(file);
        } catch (Exception e) {
            log.log(Level.WARNING, "", e);
        }
    }
    public static BasicDBList group(String collectionName, DBObject key,
                                    DBObject cond, DBObject initial, String reduce, String finalize) {
        BasicDBList list = null;
        try {
            DBCollection collection = MongoConnect.getInstance().getDB()
                    .getCollection(collectionName);
            list = (BasicDBList) collection.group(key, cond, initial, reduce,
                    finalize);
        } catch (Exception e) {
            log.log(Level.WARNING, "", e);
        }
        return list;
    }

    public static BasicDBList groupFromReportDb(String collectionName, DBObject key,
                                    DBObject cond, DBObject initial, String reduce, String finalize) {
        BasicDBList list = null;
        try {
            DBCollection collection = MongoConnect.getInstance().getReportDB()
                    .getCollection(collectionName);
            list = (BasicDBList) collection.group(key, cond, initial, reduce,
                    finalize);
        } catch (Exception e) {
            log.log(Level.WARNING, "", e);
        }
        return list;
    }

    public static BasicDBList groupFromReportDb(String dbName, String collectionName, DBObject key,
                                                DBObject cond, DBObject initial, String reduce, String finalize) {
        BasicDBList list = null;
        try {
            DBCollection collection = MongoConnect.getInstance().getReportDB(dbName)
                    .getCollection(collectionName);
            list = (BasicDBList) collection.group(key, cond, initial, reduce,
                    finalize);
        } catch (Exception e) {
            log.log(Level.WARNING, "", e);
        }
        return list;
    }

    public static BasicDBList group(String collectionName, DBObject key,
                                    DBObject cond, DBObject initial, String reduce, String finalize,String accountId) {
        BasicDBList list = null;
        try {
            DBCollection collection = MongoConnect.getInstance().getDB(AccountUtil.getAccountDb(accountId))
                    .getCollection(collectionName);
            list = (BasicDBList) collection.group(key, cond, initial, reduce,
                    finalize);
        } catch (Exception e) {
            e.printStackTrace();
            log.log(Level.WARNING, "", e);
        }
        return list;
    }


    public static void updateOne(String db,String collectionName, DBObject condition, DBObject doc, WriteConcern concern) {
        try {
            DBCollection collection = MongoConnect.getInstance().getDB(db).getCollection(collectionName);
            collection.update(condition, doc, false, false, concern);
        } catch (Exception e) {
            log.log(Level.WARNING, "", e);
        }
    }
    public static void updateOne(String collectionName, DBObject condition, DBObject doc, WriteConcern concern) {
        try {
            DBCollection collection = MongoConnect.getInstance().getDB().getCollection(collectionName);
            collection.update(condition, doc, false, false, concern);
        } catch (Exception e) {
            log.log(Level.WARNING, "", e);
        }
    }

    public static void reportUpdate(String dbName, String collectionName ,DBObject find, DBObject set, boolean upsert, boolean multi){
        try {
            DBCollection collection = MongoConnect.getInstance().getReportDB(dbName)
                    .getCollection(collectionName);
            collection.update(find, set, upsert, multi);//WriteConcern.FSYNC_SAFE

        } catch (Exception e) {
            log.log(Level.WARNING, "", e);
        }
    }

    public static void reportUpsert(String dbName,String collectionName, DBObject condition,DBObject doc) {
        try {
            DBCollection collection = MongoConnect.getInstance().getReportDB(dbName)
                    .getCollection(collectionName);
            collection.update(condition, doc,true,false);
        } catch (Exception e) {
            log.log(Level.WARNING, "", e);
        }
    }
}

