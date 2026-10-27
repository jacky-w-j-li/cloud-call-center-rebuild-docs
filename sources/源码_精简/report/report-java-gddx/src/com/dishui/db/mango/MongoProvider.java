package com.dishui.db.mango;

import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;
import com.mongodb.WriteConcern;
import com.mongodb.client.FindIterable;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import com.mongodb.client.model.UpdateOptions;
import com.mongodb.client.result.UpdateResult;
import com.mongodb.gridfs.GridFS;
import com.mongodb.gridfs.GridFSDBFile;
import com.mongodb.gridfs.GridFSInputFile;
import org.bson.Document;

import java.io.File;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import java.util.logging.Level;
import java.util.logging.Logger;

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
	
//	public static CommandResult getDbStates(String dbName){
//		try {
//			return MongoConnect.getInstance().getDB(dbName).getStats();
//		} catch (Exception e) {
//			log.log(Level.WARNING,"",e);
//		}
//		return null;
//	}
	
	public static MongoDatabase getDb(String dbname){
		try{
			return MongoConnect.getInstance().getDB(dbname);
		} catch (Exception e){
			log.log(Level.WARNING,"",e);
		}
		return null;
	}

	public static void insert(String collectionName, Document map) {
		try {
			MongoCollection collection = MongoConnect.getInstance().getDB()
					.getCollection(collectionName);
			collection.insertOne(map);
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}
	}

    public static void insertDBObject(String collectionName, BasicDBObject map) {
        try {
            MongoCollection collection = MongoConnect.getInstance().getDB()
                    .getCollection(collectionName, BasicDBObject.class);
            collection.insertOne(map);
        } catch (Exception e) {
            log.log(Level.WARNING, "", e);
        }
    }

	public static UpdateResult update(String collectionName, BasicDBObject condition,
			BasicDBObject doc, boolean upsert) {
		try {
			MongoCollection collection = MongoConnect.getInstance().getDB()
					.getCollection(collectionName);
            UpdateOptions updateOptions = new UpdateOptions();
            updateOptions.upsert(upsert);
			UpdateResult rs = collection.updateOne(condition, doc, updateOptions);

			return rs;
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}

		return null;
	}
	
	public static UpdateResult update(String collectionName, BasicDBObject condition,
			BasicDBObject doc, boolean upsert,WriteConcern wc) {
		try {
			MongoCollection collection = MongoConnect.getInstance().getDB()
					.getCollection(collectionName).withWriteConcern(wc);
            UpdateOptions updateOptions = new UpdateOptions();
            updateOptions.upsert(upsert);
			UpdateResult rs = collection.updateOne(condition, doc, updateOptions);

			return rs;
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}

		return null;
	}

    public static void updateMany(String collectionName, BasicDBObject condition,
                              BasicDBObject doc) {
        try {
            MongoCollection collection = MongoConnect.getInstance().getDB()
                    .getCollection(collectionName);
            collection.updateMany(condition, doc);
        } catch (Exception e) {
            log.log(Level.WARNING, "", e);
        }
    }

    public static void remove(String collectionName, BasicDBObject condition) {
		try {
			MongoCollection collection = MongoConnect.getInstance().getDB()
					.getCollection(collectionName);
//            System.out.println(condition.toString());
			collection.deleteOne(condition);
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}
	}

//	public static void remove(String collectionName, DBObject condition,String accountId) {
//		try {
//			DBCollection collection = MongoConnect.getInstance().getDB(AccountUtil.getAccountDb(accountId))
//					.getCollection(collectionName);
//			collection.remove(condition);
//		} catch (Exception e) {
//			log.log(Level.WARNING, "", e);
//		}
//	}
//
//	public static List<DBObject> find(String collectionName, DBObject condition) {
//		List<DBObject> map = new ArrayList<DBObject>();
//		try {
//			DBCollection collection = MongoConnect.getInstance().getDB()
//					.getCollection(collectionName);
//			DBCursor result = collection.find(condition);
//			while (result.hasNext()) {
//				DBObject ob = result.next();
//				map.add(ob);
//			}
//		} catch (Exception e) {
//			log.log(Level.WARNING, "", e);
//		}
//		return map;
//	}
//
//    public static List<DBObject> find(String dbName,String collectionName,DBObject condition){
//        List<DBObject> map = new ArrayList<DBObject>();
//        try {
//            DBCollection collection =  MongoConnect.getInstance().getDB(dbName).getCollection(collectionName);
//            DBCursor result = collection.find(condition);
//            while (result.hasNext()) {
//                DBObject ob = result.next();
//                map.add(ob);
//            }
//        } catch (Exception e) {
//            log.log(Level.WARNING, "", e);
//        }
//        return map;
//    }
//
//
//
//
//    public static List<DBObject> find(String dbName,String collectionName,DBObject condition,DBObject returnFields){
//        List<DBObject> map = new ArrayList<DBObject>();
//        try {
//            DBCollection collection =  MongoConnect.getInstance().getDB(dbName).getCollection(collectionName);
//            DBCursor result = collection.find(condition, returnFields);
//            while (result.hasNext()) {
//                DBObject ob = result.next();
//                map.add(ob);
//            }
//        } catch (Exception e) {
//            log.log(Level.WARNING, "", e);
//        }
//        return map;
//    }
//
//	public static List<DBObject> find(String collectionName, DBObject condition,String accountId) {
//		List<DBObject> map = new ArrayList<DBObject>();
//		try {
//			DBCollection collection = MongoConnect.getInstance().getDB(AccountUtil.getAccountDb(accountId))
//					.getCollection(collectionName);
//			DBCursor result = collection.find(condition);
//			while (result.hasNext()) {
//				DBObject ob = result.next();
//				map.add(ob);
//			}
//		} catch (Exception e) {
//			log.log(Level.WARNING, "", e);
//		}
//		return map;
//	}
//
//    public static List<DBObject> find(String collectionName, DBObject condition, DBObject returnFields , String accountId ,int limit) {
//        List<DBObject> map = new ArrayList<DBObject>();
//        try {
//            DBCollection collection = MongoConnect.getInstance().getDB(AccountUtil.getAccountDb(accountId))
//                    .getCollection(collectionName);
//            DBCursor result = collection.find(condition , returnFields).limit(limit);
//            while (result.hasNext()) {
//                DBObject ob = result.next();
//                map.add(ob);
//            }
//        } catch (Exception e) {
//            log.log(Level.WARNING, "", e);
//        }
//        return map;
//    }
//
    public static List<BasicDBObject> find(String collectionName, BasicDBObject condition,int limit) {
        List<BasicDBObject> events = new ArrayList<BasicDBObject>();
        try {
            MongoCollection<BasicDBObject> collection = MongoConnect.getInstance().getDB()
                    .getCollection(collectionName, BasicDBObject.class);
            FindIterable result = collection.find(condition).limit(limit);
            for(Iterator<BasicDBObject> iterator =result.iterator(); iterator.hasNext();){
                BasicDBObject event = iterator.next();
                events.add(event);
            }
        } catch (Exception e) {
            log.log(Level.WARNING, "", e);
        }
        return events;
    }

    public static List<BasicDBObject> find(String collectionName, BasicDBObject condition) {
        List<BasicDBObject> events = new ArrayList<BasicDBObject>();
        try {
            MongoCollection<BasicDBObject> collection = MongoConnect.getInstance().getDB()
                    .getCollection(collectionName, BasicDBObject.class);
            FindIterable result = collection.find(condition);
            for(Iterator<BasicDBObject> iterator =result.iterator(); iterator.hasNext();){
                BasicDBObject event = iterator.next();
                events.add(event);
            }
        } catch (Exception e) {
            log.log(Level.WARNING, "", e);
        }
        return events;
    }

    public static List<BasicDBObject> find(String collectionName, BasicDBObject condition, BasicDBObject sort) {
        List<BasicDBObject> events = new ArrayList<BasicDBObject>();
        try {
            MongoCollection<BasicDBObject> collection = MongoConnect.getInstance().getDB()
                    .getCollection(collectionName, BasicDBObject.class);
            FindIterable result = collection.find(condition).sort(sort);
            for(Iterator<BasicDBObject> iterator =result.iterator(); iterator.hasNext();){
                BasicDBObject event = iterator.next();
                events.add(event);
            }
        } catch (Exception e) {
            log.log(Level.WARNING, "", e);
        }
        return events;
    }

    public static List<BasicDBObject> find(String collectionName, BasicDBObject condition, BasicDBObject sort,int limit) {
        List<BasicDBObject> events = new ArrayList<BasicDBObject>();
        try {
            MongoCollection<BasicDBObject> collection = MongoConnect.getInstance().getDB()
                    .getCollection(collectionName, BasicDBObject.class);
            FindIterable result = collection.find(condition).sort(sort).limit(limit);
            for(Iterator<BasicDBObject> iterator =result.iterator(); iterator.hasNext();){
                BasicDBObject event = iterator.next();
                events.add(event);
            }
        } catch (Exception e) {
            log.log(Level.WARNING, "", e);
        }
        return events;
    }

	public static BasicDBObject findOne(String collectionName, BasicDBObject condition) {
		try {
			MongoCollection<BasicDBObject> collection = MongoConnect.getInstance().getDB()
					.getCollection(collectionName, BasicDBObject.class);
			FindIterable result = collection.find(condition);
			for(Iterator<BasicDBObject> iterator =result.iterator(); iterator.hasNext();){
				return iterator.next();
			}
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}
		return null;
	}

    public static List<BasicDBObject> findFromApp(String dbName, String collectionName, BasicDBObject condition, BasicDBObject returnFields) {
        List<BasicDBObject> accounts = new ArrayList<BasicDBObject>();
        try {
            MongoCollection<BasicDBObject> collection = MongoConnect.getInstance().getAppDB(dbName)
                    .getCollection(collectionName, BasicDBObject.class);
            FindIterable result = collection.find(condition).projection(returnFields);
            for(Iterator<BasicDBObject> iterator =result.iterator(); iterator.hasNext();){
                BasicDBObject account = iterator.next();
                accounts.add(account);
            }
        } catch (Exception e) {
            log.log(Level.WARNING, "", e);
        }
        return accounts;
    }

    public static List<BasicDBObject> findFromApp(String dbName, String collectionName, BasicDBObject condition) {
        List<BasicDBObject> accounts = new ArrayList<BasicDBObject>();
        try {
            MongoCollection<BasicDBObject> collection = MongoConnect.getInstance().getAppDB(dbName)
                    .getCollection(collectionName, BasicDBObject.class);
            FindIterable result = collection.find(condition);
            for(Iterator<BasicDBObject> iterator = result.iterator(); iterator.hasNext();){
                BasicDBObject account = iterator.next();
                accounts.add(account);
            }
        } catch (Exception e) {
            log.log(Level.WARNING, "", e);
        }
        return accounts;
    }

	public static BasicDBObject findOneFromApp(String dbName, String collectionName, BasicDBObject condition) {
		try {
			MongoCollection<BasicDBObject> collection = MongoConnect.getInstance().getAppDB(dbName)
					.getCollection(collectionName, BasicDBObject.class);
			FindIterable result = collection.find(condition);
			for(Iterator<BasicDBObject> iterator = result.iterator(); iterator.hasNext();){
				return iterator.next();
			}
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}

		return null;
	}

	public static BasicDBObject findTopFromApp(String dbName, String collectionName, BasicDBObject condition,BasicDBObject sort) {
		try {
			MongoCollection<BasicDBObject> collection = MongoConnect.getInstance().getAppDB(dbName)
					.getCollection(collectionName, BasicDBObject.class);
			FindIterable result = collection.find(condition).sort(sort).limit(1);
			for(Iterator<BasicDBObject> iterator = result.iterator(); iterator.hasNext();){
				return iterator.next();
			}
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}
		return null;
	}


    public static long countFromApp(String dbName, String collectionName, BasicDBObject condition) {
        long result = 0;
        try {
            MongoCollection<BasicDBObject> collection = MongoConnect.getInstance().getAppDB(dbName)
                    .getCollection(collectionName, BasicDBObject.class);
            result = collection.count(condition);

        } catch (Exception e) {
            log.log(Level.WARNING, "", e);
        }
        return result;
    }
//
//
//	public static DBObject findOne(String collectionName,DBObject condition){
//		DBObject result = null;
//		try {
//			DBCollection collection = MongoConnect.getInstance().getDB()
//					.getCollection(collectionName);
//			result = collection.findOne(condition);
//		} catch (Exception e) {
//			log.log(Level.WARNING, "", e);
//		}
//		return result;
//	}
//
//	public static DBObject findOne(String collectionName,DBObject condition,String accountId){
//		DBObject result = null;
//		try {
//			DBCollection collection = MongoConnect.getInstance().getDB(AccountUtil.getAccountDb(accountId))
//					.getCollection(collectionName);
//			result = collection.findOne(condition);
//		} catch (Exception e) {
//			log.log(Level.WARNING, "", e);
//		}
//		return result;
//	}
//
//	public static DBObject findOne(String dbName,String collectionName,DBObject condition){
//		DBObject result = null;
//		try {
//			DBCollection collection =  MongoConnect.getInstance().getDB(dbName).getCollection(collectionName);
//			result = collection.findOne(condition);
//		} catch (Exception e) {
//			log.log(Level.WARNING, "", e);
//		}
//		return result;
//	}
//
//
//
//	public static DBObject findAndModify(String collectionName,DBObject condition,DBObject udpate,boolean upsert){
//		DBObject result = null;
//		try {
//			DBCollection collection = MongoConnect.getInstance().getDB()
//					.getCollection(collectionName);
//			result = collection.findAndModify(condition, null, null, false, udpate, true, upsert);
//		} catch (Exception e) {
//			log.log(Level.WARNING, "", e);
//		}
//		return result;
//	}
//
//	public static DBObject findAndModify(String collectionName,DBObject condition,DBObject udpate,boolean upsert,String accountId){
//		DBObject result = null;
//		try {
//			DBCollection collection = MongoConnect.getInstance().getDB(AccountUtil.getAccountDb(accountId))
//					.getCollection(collectionName);
//			result = collection.findAndModify(condition, null, null, false, udpate, true, upsert);
//		} catch (Exception e) {
//			log.log(Level.WARNING, "", e);
//		}
//		return result;
//	}
//
//	public static List<DBObject> find(String collectionName,
//			DBObject condition, DBObject keys) {
//		List<DBObject> map = new ArrayList<DBObject>();
//		try {
//			DBCollection collection = MongoConnect.getInstance().getDB()
//					.getCollection(collectionName);
//			DBCursor result = collection.find(condition, keys);
//			while (result.hasNext()) {
//				DBObject ob = result.next();
//				map.add(ob);
//			}
//		} catch (Exception e) {
//			log.log(Level.WARNING, "", e);
//		}
//		return map;
//	}
//
//	public static List<DBObject> find(String collectionName,
//			DBObject condition, DBObject keys,String accountId) {
//		List<DBObject> map = new ArrayList<DBObject>();
//		try {
//			DBCollection collection = MongoConnect.getInstance().getDB(AccountUtil.getAccountDb(accountId))
//					.getCollection(collectionName);
//			DBCursor result = collection.find(condition, keys);
//			while (result.hasNext()) {
//				DBObject ob = result.next();
//				map.add(ob);
//			}
//		} catch (Exception e) {
//			log.log(Level.WARNING, "", e);
//		}
//		return map;
//	}
//
//	public static DBCollection getConection(String collectionName) {
//		DBCollection collection = MongoConnect.getInstance().getDB()
//				.getCollection(collectionName);
//		return collection;
//	}
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



	
	/**
	 * 
	 * @param filename
	 * @param file
	 * @return
	 */
	public static boolean saveFile(String filename, String file, String collection) {
		try {
			GridFS gfs = new GridFS(MongoConnect.getInstance().getOldDb(), collection);
			GridFSInputFile input = gfs.createFile(file);
			input.setFilename(filename);
			input.save();
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
			return false;
		}
		return true;
	}

	public static boolean saveFile(String account, String filename, File file, String collection) {
		try {
			GridFS gfs = new GridFS(MongoConnect.getInstance().getOldDb(), collection);
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
			GridFS gfs = new GridFS(MongoConnect.getInstance().getOldDb(), collection);
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
			GridFS gfs = new GridFS(MongoConnect.getInstance().getOldDb(), colletion);
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
			GridFS gfs = new GridFS(MongoConnect.getInstance().getOldDb(fileDB), fileDBCollection);
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
			GridFS gfs = new GridFS(MongoConnect.getInstance().getOldDb(), colletion);
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

//	public static String getAccountDB(String accountId){
//		try {
//			DBObject data=MongoProvider.findOne("bill","platform_account_product", new BasicDBObject("_id",accountId+"_cc"));
//			String db=data.get("dataDB").toString();
//			return db;
//		} catch (Exception e) {
//			e.printStackTrace();
//			log.log(Level.WARNING, "", e);
//		}
//		return null;
//	}


    public static void writeFileStreamById (String fileId,File file){
        try {
            GridFS gfs = new GridFS(MongoConnect.getInstance().getOldDb(fileDB), fileDBCollection);
            DBObject con = new BasicDBObject();
            con.put("_id", fileId);
            GridFSDBFile output = gfs.findOne(con);
            output.writeTo(file);
        } catch (Exception e) {
            log.log(Level.WARNING, "", e);
        }
    }
//    public static BasicDBList group(String collectionName, DBObject key,
//                                    DBObject cond, DBObject initial, String reduce, String finalize) {
//        BasicDBList list = null;
//        try {
//            DBCollection collection = MongoConnect.getInstance().getDB()
//                    .getCollection(collectionName);
//            list = (BasicDBList) collection.group(key, cond, initial, reduce,
//                    finalize);
//        } catch (Exception e) {
//            log.log(Level.WARNING, "", e);
//        }
//        return list;
//    }
//
//    public static BasicDBList group(String collectionName, DBObject key,
//                                    DBObject cond, DBObject initial, String reduce, String finalize,String accountId) {
//        BasicDBList list = null;
//        try {
//            DBCollection collection = MongoConnect.getInstance().getDB(AccountUtil.getAccountDb(accountId))
//                    .getCollection(collectionName);
//            list = (BasicDBList) collection.group(key, cond, initial, reduce,
//                    finalize);
//        } catch (Exception e) {
//            e.printStackTrace();
//            log.log(Level.WARNING, "", e);
//        }
//        return list;
//    }
//
//
//    public static void updateOne(String db,String collectionName, DBObject condition, DBObject doc, WriteConcern concern) {
//        try {
//            DBCollection collection = MongoConnect.getInstance().getDB(db).getCollection(collectionName);
//            collection.update(condition, doc, false, false, concern);
//        } catch (Exception e) {
//            log.log(Level.WARNING, "", e);
//        }
//    }
//    public static void updateOne(String collectionName, DBObject condition, DBObject doc, WriteConcern concern) {
//        try {
//            DBCollection collection = MongoConnect.getInstance().getDB().getCollection(collectionName);
//            collection.update(condition, doc, false, false, concern);
//        } catch (Exception e) {
//            log.log(Level.WARNING, "", e);
//        }
//    }
}

