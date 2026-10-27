package com.dishui.db.mango;

import java.io.File;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import java.util.Random;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.dishui.manager.service.AppConfig;
import com.dishui.util.AccountUtil;
import com.dishui.util.log.IceLogger;
import com.dishui.util.log.SystemOutHandler;
import com.mongodb.*;
import com.mongodb.bulk.*;
import com.mongodb.client.*;
import com.mongodb.client.model.UpdateOneModel;
import com.mongodb.client.model.UpdateOptions;
import com.mongodb.client.result.UpdateResult;

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
	public static final String fileMongoDatabase = "cc_file";
	public static final String fileMongoCollection = "fs";

	private static Logger log = Logger.getLogger(MongoProvider.class.getName());
	

	public static MongoDatabase getDb(String dbname){
		try{
			return MongoConnect.getInstance().getDB(dbname);
		} catch (Exception e){
			log.log(Level.WARNING,"",e);
		}
		return null;
	}

	public static List distinct(String collectionName,String key, BasicDBObject con){
		List result = new ArrayList();
		try{
            MongoCollection collection = MongoConnect.getInstance().getDB()
					.getCollection(collectionName, BasicDBObject.class);

			DistinctIterable<String> iterable = collection.distinct(key, String.class).filter(con);
			MongoCursor ito = iterable.iterator();
			while (ito.hasNext()){
				result.add(ito.next());
			}
		}catch(Exception e){
			log.log(Level.WARNING, "", e);
		}
		return result;
	}


	public static long count(String collectionName, BasicDBObject map) {
		try {
			MongoCollection collection = MongoConnect.getInstance().getDB()
					.getCollection(collectionName, BasicDBObject.class);
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

	public static long count(String collectionName, BasicDBObject map,String accountId) {
		try {
			MongoCollection collection = MongoConnect.getInstance().getDB(AccountUtil.getAccountDb(accountId))
					.getCollection(collectionName, BasicDBObject.class);
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

    public static long count(String dbName, String collectionName, BasicDBObject map) {
        try {
            MongoCollection collection = MongoConnect.getInstance().getDB(dbName)
                    .getCollection(collectionName, BasicDBObject.class);
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

	public static void insertOne(String collectionName, BasicDBObject map) {
		try {
			MongoCollection collection = MongoConnect.getInstance().getDB()
					.getCollection(collectionName, BasicDBObject.class);
			collection.insertOne(map);

		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}
	}

	public static void insertOne(String collectionName, BasicDBObject map,String accountId) {
		try {
			MongoCollection collection = MongoConnect.getInstance().getDB(AccountUtil.getAccountDb(accountId))
					.getCollection(collectionName, BasicDBObject.class);
			collection.insertOne(map);

		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}
	}

	public static void updateOne(String collectionName, BasicDBObject condition,
			BasicDBObject doc) {
		try {
			MongoCollection collection = MongoConnect.getInstance().getDB()
					.getCollection(collectionName, BasicDBObject.class);
			collection.updateOne(condition, doc);
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}
	}

	public static UpdateResult updateMulti(String collectionName, BasicDBObject condition,
										   BasicDBObject doc, WriteConcern writeConcern) {
		try {
			MongoCollection collection = MongoConnect.getInstance().getDB()
					.getCollection(collectionName, BasicDBObject.class).withWriteConcern(writeConcern);
			UpdateResult result = collection.updateMany(condition, doc,new UpdateOptions());
			return result;
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}
		return null;
	}

	public static void updateOne(String collectionName, BasicDBObject condition,
			BasicDBObject doc,String accountId) {
		try {
			MongoCollection collection = MongoConnect.getInstance().getDB(AccountUtil.getAccountDb(accountId))
					.getCollection(collectionName, BasicDBObject.class);
			collection.updateOne(condition, doc);
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}
	}
    public static void updateByDB(String db,String collectionName, BasicDBObject condition,
                                  BasicDBObject doc) {
        try {
            MongoCollection collection = MongoConnect.getInstance().getDB(db)
                    .getCollection(collectionName, BasicDBObject.class);
            collection.updateOne(condition, doc);
        } catch (Exception e) {
            log.log(Level.WARNING, "", e);
        }
    }

	public static void insertByReportDb(String collectionName,
							  BasicDBObject doc) {
		try {
			MongoCollection collection = MongoConnect.getInstance().getReportDB()
					.getCollection(collectionName, BasicDBObject.class);
			collection.insertOne(doc);
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}
	}

	public static void insertByReportDbName(String dbName, String collectionName,
										BasicDBObject doc, WriteConcern writeConcern) {
		try {
			MongoCollection collection = MongoConnect.getInstance().getReportDB(dbName)
					.getCollection(collectionName,  BasicDBObject.class).withWriteConcern(writeConcern);
			collection.insertOne(doc);
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}
	}

    public static void removeOne(String collectionName, BasicDBObject condition) {
		try {
			MongoCollection collection = MongoConnect.getInstance().getDB()
					.getCollection(collectionName, BasicDBObject.class);
			collection.deleteOne(condition);
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}
	}

	public static void removeOne(String collectionName, BasicDBObject condition,String accountId) {
		try {
			MongoCollection collection = MongoConnect.getInstance().getDB(AccountUtil.getAccountDb(accountId))
					.getCollection(collectionName, BasicDBObject.class);
			collection.deleteOne(condition);
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}
	}

	public static List<BasicDBObject> find(String collectionName, BasicDBObject condition) {
		List<BasicDBObject> map = new ArrayList<BasicDBObject>();
		try {
			MongoCollection collection = MongoConnect.getInstance().getDB()
					.getCollection(collectionName, BasicDBObject.class);
			Iterator<BasicDBObject> result = collection.find(condition).iterator();
			while (result.hasNext()) {
				BasicDBObject ob = result.next();
				map.add(ob);
			}
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}
		return map;
	}

    public static List<BasicDBObject> findFromReportDb(String collectionName, BasicDBObject condition) {
        List<BasicDBObject> map = new ArrayList<BasicDBObject>();
        try {
            MongoCollection collection = MongoConnect.getInstance().getReportDB()
                    .getCollection(collectionName, BasicDBObject.class);
            Iterator<BasicDBObject> result = collection.find(condition).iterator();
            while (result.hasNext()) {
                BasicDBObject ob = result.next();
                map.add(ob);
            }
        } catch (Exception e) {
            log.log(Level.WARNING, "", e);
        }
        return map;
    }


	public static List<BasicDBObject> findFromReportDbName(String dbName, String collectionName, BasicDBObject condition,BasicDBObject sort, int limit) {
		List<BasicDBObject> map = new ArrayList<BasicDBObject>();
		try {
			long start = System.currentTimeMillis();
			MongoCollection collection = MongoConnect.getInstance().getReportDB(dbName)
					.getCollection(collectionName, BasicDBObject.class);
			Iterator<BasicDBObject> result = collection.find(condition).sort(sort).limit(limit).iterator();
//			for(Iterator<BasicDBObject> iterator =result.iterator(); iterator.hasNext();){
//				BasicDBObject event = iterator.next();
//				map.add(event);
//			}
			while (result.hasNext()) {
				BasicDBObject ob = result.next();
				map.add(ob);
			}
			System.out.println("###"+(System.currentTimeMillis() - start));
//			System.out.println(map.size());
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}
		return map;
	}

	public static void main(String[] args){
		AppConfig.getInstance();
		IceLogger.initLogger(AppConfig.getInstance().getLogDir(),
				"managerService", AppConfig.getInstance().getLogLevel(),
				true);
		System.out.println("Starting MongoDatabase plugin...");
		MongoConnect.getInstance().connect();
		MongoProvider.findFromReportDbName("assign", "app_im_assign_task", new BasicDBObject(), new BasicDBObject("time", 1), 100);
		MongoProvider.findFromReportDbName("assign", "app_im_assign_task", new BasicDBObject(), new BasicDBObject("time", 1), 100);
		MongoProvider.findFromReportDbName("assign", "app_im_assign_task", new BasicDBObject(), new BasicDBObject("time", 1), 100);
	}



    public static List<BasicDBObject> find(String dbName,String collectionName,BasicDBObject condition){
        List<BasicDBObject> map = new ArrayList<BasicDBObject>();
        try {
            MongoCollection collection =  MongoConnect.getInstance().getDB(dbName).getCollection(collectionName, BasicDBObject.class);
			FindIterable result = collection.find(condition);
			for(Iterator<BasicDBObject> iterator =result.iterator(); iterator.hasNext();){
				BasicDBObject event = iterator.next();
				map.add(event);
			}

        } catch (Exception e) {
            log.log(Level.WARNING, "", e);
        }
        return map;
    }

	public static List<BasicDBObject> find(String collectionName,BasicDBObject condition, int limit, BasicDBObject sort){
		List<BasicDBObject> map = new ArrayList<BasicDBObject>();
		try {
			MongoCollection collection =  MongoConnect.getInstance().getDB().getCollection(collectionName, BasicDBObject.class);
			Iterator<BasicDBObject> result = collection.find(condition).sort(sort).limit(limit).iterator();
			while (result.hasNext()) {
				BasicDBObject ob = result.next();
				map.add(ob);
			}
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}
		return map;
	}

	public static List<BasicDBObject> find(String collectionName,BasicDBObject condition, int skip, int limit, BasicDBObject sort){
		List<BasicDBObject> map = new ArrayList<BasicDBObject>();
		try {
			MongoCollection collection =  MongoConnect.getInstance().getDB().getCollection(collectionName, BasicDBObject.class);
			Iterator<BasicDBObject> result = collection.find(condition).sort(sort).skip(skip).limit(limit).iterator();
			while (result.hasNext()) {
				BasicDBObject ob = result.next();
				map.add(ob);
			}
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}
		return map;
	}

	public static List<BasicDBObject> find(String collectionName,BasicDBObject condition, BasicDBObject fields, int skip, int limit){
		List<BasicDBObject> map = new ArrayList<BasicDBObject>();
		try {
			MongoCollection collection =  MongoConnect.getInstance().getDB().getCollection(collectionName, BasicDBObject.class);
			Iterator<BasicDBObject> result = collection.find(condition).projection(fields).skip(skip).limit(limit).iterator();
			while (result.hasNext()) {
				BasicDBObject ob = result.next();
				map.add(ob);
			}
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}
		return map;
	}



	public static BasicDBObject findOne(String collectionName,BasicDBObject condition){
		BasicDBObject result = null;
		try {
			MongoCollection collection = MongoConnect.getInstance().getDB()
					.getCollection(collectionName, BasicDBObject.class);
			MongoCursor cursor = collection.find(condition).iterator();
			if(cursor.hasNext()){
				result = (BasicDBObject) cursor.next();
			}
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}
		return result;
	}

	public static BasicDBObject findOne(String collectionName,BasicDBObject condition,String accountId){
		BasicDBObject result = null;
		try {
			MongoCollection collection = MongoConnect.getInstance().getDB(AccountUtil.getAccountDb(accountId))
					.getCollection(collectionName, BasicDBObject.class);
			MongoCursor cursor = collection.find(condition).iterator();
			if(cursor.hasNext()){
				result = (BasicDBObject) cursor.next();
			}
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}
		return result;
	}

	public static BasicDBObject findOne(String dbName,String collectionName,BasicDBObject condition){
		BasicDBObject result = null;
		try {
			MongoCollection collection =  MongoConnect.getInstance().getDB(dbName).getCollection(collectionName, BasicDBObject.class);
			MongoCursor cursor = collection.find(condition).iterator();
			if(cursor.hasNext()){
				result = (BasicDBObject) cursor.next();
			}
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}
		return result;
	}




	public static void batchInsert(String collectionName, List<BasicDBObject> list) {
		try {
			MongoCollection collection = MongoConnect.getInstance().getDB()
					.getCollection(collectionName, BasicDBObject.class);
			collection.insertMany(list);//WriteConcern.FSYNC_SAFE

		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}
	}

    public static void reportBatchInsert(String collectionName , List<BasicDBObject> list){
        try {
            MongoCollection collection = MongoConnect.getInstance().getReportDB()
                    .getCollection(collectionName, BasicDBObject.class);
            collection.insertMany(list);//WriteConcern.FSYNC_SAFE

        } catch (Exception e) {
            log.log(Level.WARNING, "", e);
        }
    }

    public static void batchInsert(String dbName, String collectionName, List<BasicDBObject> list) {
        try {
//            MongoDatabase db=MongoConnect.getInstance().getDB(dbName);
//            db.requestStart();
            MongoCollection collection = MongoConnect.getInstance().getDB(dbName)
                    .getCollection(collectionName, BasicDBObject.class);
            collection.insertMany(list);
//            WriteResult ret =collection.insert(list,WriteConcern.FSYNC_SAFE);
//            if(!ret.getLastError().ok()){
//                log.log(Level.WARNING, "mongdb update failed! getLastError = " + ret.getLastError().getErrorMessage());
//            }
//            db.requestDone();
        } catch (Exception e) {
            log.log(Level.WARNING, "", e);
        }
    }

	public static void batchInsert(String collectionName, List<BasicDBObject> list,String accountId) {
		try {
			MongoCollection collection = MongoConnect.getInstance().getDB(AccountUtil.getAccountDb(accountId))
					.getCollection(collectionName, BasicDBObject.class);
			collection.insertMany(list);

		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}
	}

	public static void bulkWrite(String dbName, String collectionName,List ops, WriteConcern wc) {
		try {
			MongoCollection collection = MongoConnect.getInstance().getDB(dbName).
					getCollection(collectionName, BasicDBObject.class).withWriteConcern(wc);
			collection.bulkWrite(ops);
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}
	}
	public static void bulkWriteByReportDB(String collectionName,List ops, WriteConcern wc) {
		try {
			MongoCollection collection = MongoConnect.getInstance().getReportDB().
					getCollection(collectionName, BasicDBObject.class).withWriteConcern(wc);
			collection.bulkWrite(ops);
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}
	}


    public static void batchUpdate(String collectionName, BasicDBObject condition,BasicDBObject doc) {
        try {
            MongoCollection collection = MongoConnect.getInstance().getDB()
                    .getCollection(collectionName, BasicDBObject.class);
            collection.updateMany(condition, doc);
        } catch (Exception e) {
            log.log(Level.WARNING, "", e);
        }
    }


    public static void updateOne(String db,String collectionName, BasicDBObject condition, BasicDBObject doc, WriteConcern concern) {
        try {
            MongoCollection collection = MongoConnect.getInstance().getDB(db).getCollection(collectionName, BasicDBObject.class).withWriteConcern(concern);
            collection.updateOne(condition, doc);
        } catch (Exception e) {
            log.log(Level.WARNING, "", e);
        }
    }
    public static void updateOne(String collectionName, BasicDBObject condition, BasicDBObject doc, WriteConcern concern) {
        try {
            MongoCollection collection = MongoConnect.getInstance().getDB().getCollection(collectionName, BasicDBObject.class).withWriteConcern(concern);
            collection.updateOne(condition, doc);
        } catch (Exception e) {
            log.log(Level.WARNING, "", e);
        }
    }

	public static void removeFromReportDbName(String dbName, String collectionName, BasicDBObject condition, WriteConcern writeConcern) {
		try {
			MongoCollection collection = MongoConnect.getInstance().getReportDB(dbName).getCollection(collectionName, BasicDBObject.class).withWriteConcern(writeConcern);
			collection.deleteOne(condition);
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}
	}

	public static void removeManyFromReportDbName(String dbName, String collectionName, BasicDBObject condition, WriteConcern writeConcern) {
		try {
			MongoCollection collection = MongoConnect.getInstance().getReportDB(dbName).getCollection(collectionName, BasicDBObject.class).withWriteConcern(writeConcern);
			collection.deleteMany(condition);
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}
	}

	public static void dropReportDBTable(String dbName, String collectionName){

		try{
			MongoCollection collection = MongoConnect.getInstance().getReportDB(dbName).getCollection(collectionName);
			if(collection != null){
				collection.drop();
			}
		}catch (Exception e){
			log.log(Level.WARNING, "", e);
		}
	}

	public static long countFromReportDb(String dbName, String collectionName, BasicDBObject map) {
		try {
			MongoCollection collection = MongoConnect.getInstance().getReportDB(dbName)
					.getCollection(collectionName, BasicDBObject.class);
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
}

