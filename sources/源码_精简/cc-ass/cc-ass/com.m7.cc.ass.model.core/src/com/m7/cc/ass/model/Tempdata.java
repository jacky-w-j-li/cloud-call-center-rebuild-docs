package com.m7.cc.ass.model;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;
import java.io.FileWriter;
import java.io.IOException;
import java.util.Hashtable;
import java.util.Iterator;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.ass.model.configuration.C5Queue;
import com.m7.cc.ass.model.configuration.ServiceNo;
import com.m7.cc.ass.model.configuration.User;
import com.m7.cc.command.Fields;
import com.m7.cc.config.ConfPeer;
import com.m7.cc.config.ConfigProvider;
import com.m7.cc.config.Configure;
import com.m7.cc.config.ConfigureParserException;
import com.m7.cc.util.Utils;

public class Tempdata {
	public static Logger log = Logger.getLogger(Tempdata.class.getName());
	public static final String tempDir = "./temp_data/peer_data";
	public static final String sipTempDir  = "./temp_data/sip_data";
	private static ConfigProvider confProvider = new ConfigProvider();
	private static Hashtable<String, Configure> configs = new Hashtable<String, Configure>();

	public static void deleteOldDataFile() {
		File file = new File("temp_data");
		if (file.exists()) {
			File[] files = file.listFiles();
			for (int i = 0; i < files.length; i++) {
				log.info("Deletting temp data file: " + files[i].getName());
				files[i].delete();
			}
		}
	}

	/**
	 * This method should only be called by C5Asterisk.
	 * 
	 * @param pbx
	 * @param trunks
	 */
	public static void loadTrunkData(String pbx,
			Hashtable<String, ServiceNo> trunks) {
		log.info("Loading trunk data: " + pbx);
		File directory = new File("temp_data");
		if (!directory.exists()) {
			directory.mkdir();
		}
		File file = new File("./temp_data/" + pbx + "_"
				+ Utils.getDate("yyyy-MM-dd") + "_trunk");
		if (!file.exists()) {
			try {
				file.createNewFile();
			} catch (IOException e) {
				log.log(Level.WARNING, "Create trunk file failed", e);
				return;
			}
		}
		BufferedReader br = null;
		try {
			br = new BufferedReader(new FileReader(file));
			String line = null;
			while ((line = br.readLine()) != null) {
				String[] data = line.split(" ");
				if (data.length < 3) {
					log.warning("Error data in " + "./temp_data/" + pbx + "_"
							+ Utils.getDate("yyyy-MM-dd") + "_trunk: " + line);
					continue;
				} else {
					String serviceNo = data[0];
					ServiceNo trunk = null;
					if (trunks.containsKey(serviceNo)) {
						trunk = trunks.get(serviceNo);
						String calls = data[1];
						String completes = data[2];
						trunk.setInCalls(Integer.valueOf(calls));
						trunk.setInComplete(Integer.valueOf(completes));
						trunk.setInLosts(trunk.getInCalls()
								- trunk.getInComplete());
						log.info("Loaded trunk data: serviceNo[" + serviceNo
								+ "] calls[" + calls + "] completes["
								+ completes + "]");
					}
				}
			}
		} catch (Exception e) {
			log.log(Level.WARNING, "Read trunk file failed", e);
		} finally {
			if (br != null)
				try {
					br.close();
				} catch (IOException e) {
					log.log(Level.WARNING, "", e);
				}
		}
	}

	/**
	 * This method should only be called by C5Asterisk.
	 * 
	 * @param pbx
	 * @param trunks
	 */
	public static void saveTrunkData(String pbx,
			Hashtable<String, ServiceNo> trunks) {
		log.fine("Saving trunk data: " + pbx);
		File directory = new File("temp_data");
		if (!directory.exists()) {
			directory.mkdir();
		}
		File file = new File("./temp_data/" + pbx + "_"
				+ Utils.getDate("yyyy-MM-dd") + "_trunk");
		if (!file.exists()) {
			try {
				file.createNewFile();
			} catch (IOException e) {
				log.log(Level.WARNING, "Create trunk file failed", e);
				return;
			}
		}
		StringBuffer sb = new StringBuffer();
		Iterator<ServiceNo> it = trunks.values().iterator();
		while (it.hasNext()) {
			ServiceNo trunk = it.next();
			sb.append(trunk.getExten() + " " + trunk.getInCalls() + " "
					+ trunk.getInComplete() + "\r\n");
		}
		FileWriter fw = null;
		try {
			fw = new FileWriter(file);
			fw.write(sb.toString());
			fw.flush();
		} catch (IOException e) {
			log.log(Level.WARNING, "Save trunk file failed - " + pbx, e);
		} finally {
			if (fw != null)
				try {
					fw.close();
				} catch (IOException e) {
					log.log(Level.WARNING, "", e);
				}
		}
	}

	/**
	 * This method should only be called by C5Asterisk.
	 * 
	 * @param pbx
	 * @param queues
	 */
	public static void loadQueueData(String pbx,
			Hashtable<String, C5Queue> queues) {
		log.fine("Loading queue data: " + pbx);
		File directory = new File("temp_data");
		if (!directory.exists()) {
			directory.mkdir();
		}
		File file = new File("./temp_data/" + pbx + "_"
				+ Utils.getDate("yyyy-MM-dd") + "_queue");
		if (!file.exists()) {
			try {
				file.createNewFile();
			} catch (IOException e) {
				log.log(Level.WARNING, "Create queue file failed", e);
				return;
			}
		}
		BufferedReader br = null;
		try {
			br = new BufferedReader(new FileReader(file));
			String line = null;
			while ((line = br.readLine()) != null) {
				String[] data = line.split(" ");
				if (data.length < 3) {
					log.warning("Error data in " + "./temp_data/" + pbx + "_"
							+ Utils.getDate("yyyy-MM-dd") + "_queue: " + line);
					continue;
				} else {
					String queueNo = data[0];
					C5Queue queue = null;
					if (queues.containsKey(queueNo)) {
						queue = queues.get(queueNo);
						String calls = data[1];
						String losts = data[2];
						queue.setTotalCalls(Integer.valueOf(calls));
						queue.setAbandoned(Integer.valueOf(losts));
					}
				}
			}
		} catch (Exception e) {
			log.log(Level.WARNING, "Read queue file failed", e);
		} finally {
			if (br != null)
				try {
					br.close();
				} catch (IOException e) {
					log.log(Level.WARNING, "", e);
				}
		}
	}

	/**
	 * This method should only be called by C5Asterisk.
	 * 
	 * @param pbx
	 * @param queues
	 */
	public static void saveQueueData(String pbx,
			Hashtable<String, C5Queue> queues) {
		log.fine("Saving queue data: " + pbx);
		File directory = new File("temp_data");
		if (!directory.exists()) {
			directory.mkdir();
		}
		File file = new File("./temp_data/" + pbx + "_"
				+ Utils.getDate("yyyy-MM-dd") + "_queue");
		if (!file.exists()) {
			try {
				file.createNewFile();
			} catch (IOException e) {
				log.log(Level.WARNING, "Create queue file failed", e);
				return;
			}
		}
		StringBuffer sb = new StringBuffer();
		Iterator<C5Queue> it = queues.values().iterator();
		while (it.hasNext()) {
			C5Queue queue = it.next();
			sb.append(queue.getExten() + " " + queue.getTotalCalls() + " "
					+ queue.getAbandoned() + "\r\n");
		}
		FileWriter fw = null;
		try {
			fw = new FileWriter(file);
			fw.write(sb.toString());
			fw.flush();
		} catch (IOException e) {
			log.log(Level.WARNING, "Save queue file failed - " + pbx, e);
		} finally {
			if (fw != null)
				try {
					fw.close();
				} catch (IOException e) {
					log.log(Level.WARNING, "", e);
				}
		}
	}

	public static synchronized void loadPeerTempData(String account,
			Hashtable<String, User> peers) {
		File dir = new File(tempDir);
		if (!dir.exists())
			dir.mkdirs();

		Configure config = null;
		if (configs.containsKey(account)) {
			config = configs.get(account);
		} else {
			try {
				File file = new File(tempDir + File.separator + account
						+ "_peer");
				if (!file.exists())
					file.createNewFile();
				config = confProvider.parser(tempDir + File.separator + account
						+ "_peer");
				configs.put(account, config);
				Iterator<User> its = peers.values().iterator();
				while (its.hasNext()) {
					User peer = its.next();
					ConfPeer cp = config.getPeer(peer.getId());
					if (cp != null) {
						if (cp.contain(Fields.ExtenType))
							peer.setExtenType(cp.getParam(Fields.ExtenType));
						if (cp.contain(Fields.DidNum))
							peer.setDidNum(cp.getParam(Fields.DidNum));
						if (cp.contain(Fields.SipNum) && !cp.getParam(Fields.SipNum).equals(""))
							peer.setSipNum(cp.getParam(Fields.SipNum));
						if (cp.contain(Fields.Reserve))
							peer.setReserve(cp.getParam(Fields.Reserve).equalsIgnoreCase("yes"));
						
						if (cp.contain(Fields.Queue)) {
							String queue = cp.getParam(Fields.Queue);
							String[] qs = queue.split(",");
							for (int i = 0; i < qs.length; i++) {
								if (!peer.getQueues().contains(qs[i])) {
									peer.addQueue(qs[i]);
								}
							}
						}
					}
				}
			} catch (ConfigureParserException e) {
				log.log(Level.WARNING, "", e);
			} catch (IOException e) {
				log.log(Level.WARNING, "", e);
			}
		}
	}

	public static synchronized void savePeerTempData(User peer) {
		try {
			Configure config = null;
			if (configs.containsKey(peer.getAccount())) {
				config = configs.get(peer.getAccount());
			} else {
				File file = new File(tempDir + File.separator + peer.getAccount()
						+ "_peer");
				if (!file.exists())
					file.createNewFile();
				config = confProvider.parser(tempDir + File.separator + peer.getAccount()
						+ "_peer");
				configs.put(peer.getAccount(), config);
			}
			ConfPeer cpeer = config.getPeer(peer.getId());
			if (cpeer == null) {
				cpeer = new ConfPeer(peer.getId());
				config.addPeer(cpeer);
			}
			cpeer.addParam(Fields.ExtenType, peer.getExtenType());
			cpeer.addParam(Fields.DidNum, peer.getDidNum());
			cpeer.addParam(Fields.Reserve, peer.isReserve()?"yes":"no");
			if (peer.getSipNum() != null)
				cpeer.addParam(Fields.SipNum, peer.getSipNum());
			else cpeer.removeParam(Fields.SipNum);
			if (peer.getQueues().size() > 0) {
				String queue = "";
				for (int i = 0; i < peer.getQueues().size(); i++) {
					queue += peer.getQueues().get(i) + ",";
				}
				queue = queue.substring(0, queue.length() - 1);
				cpeer.addParam(Fields.Queue, queue);
			}

			confProvider.save(configs.get(peer.getAccount()));
			
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}
	}

	public static synchronized void loadPeerCallTempData(String pbx, String account,
			Hashtable<String, User> peers) {
		File dir = new File("./temp_data/");
		if (!dir.exists())
			dir.mkdirs();

		File file = new File("./temp_data/" + pbx + "_" + account + "_"
				+ Utils.getDate("yyyy-MM-dd") + "_peer");
		if (!file.exists()) {
			try {
				file.createNewFile();
			} catch (IOException e) {
				log.log(Level.WARNING, "Create peer call file failed", e);
				return;
			}
		}
		BufferedReader br = null;
		try {
			br = new BufferedReader(new FileReader(file));
			String line = null;
			while ((line = br.readLine()) != null) {
				String[] data = line.split(" ");
				if (data.length < 7) {
					log.warning("Error data in " + "./temp_data/" + pbx + "_" + account+"_"
							+ Utils.getDate("yyyy-MM-dd") + "_peer: " + line);
					continue;
				} else {
					String userId = data[0];
					User user = peers.get(userId);
					user.setInCalls(Integer.valueOf(data[1]));
					user.setInCallsCompleted(Integer.valueOf(data[2]));
					user.setOutCalls(Integer.valueOf(data[3]));
					user.setOutCallsCompleted(Integer.valueOf(data[4]));
					user.setDialinTimeLength(Integer.valueOf(data[5]));
					user.setDialoutTimeLength(Integer.valueOf(data[6]));
					if(data.length > 7) {
						user.setTransferCalls(Integer.valueOf(data[7]));
						user.setTransferCallsCompleted(Integer.valueOf(data[8]));
					}
				}
			}
		} catch (Exception e) {
			log.log(Level.WARNING, "Read peer call file failed", e);
		} finally {
			if (br != null)
				try {
					br.close();
				} catch (IOException e) {
					log.log(Level.WARNING, "", e);
				}
		}
	}

	public static synchronized void savePeerCallTempData(String pbx, String account,
			Hashtable<String, User> peers) {
		File dir = new File(tempDir);
		if (!dir.exists())
			dir.mkdirs();

		File file = new File("./temp_data/" + pbx + "_" + account + "_"
				+ Utils.getDate("yyyy-MM-dd") + "_peer");
		if (!file.exists()) {
			try {
				file.createNewFile();
			} catch (IOException e) {
				log.log(Level.WARNING, "Create peer call file failed", e);
				return;
			}
		}
		StringBuffer sb = new StringBuffer();
		Iterator<User> it = peers.values().iterator();
		while (it.hasNext()) {
			User user = it.next();
			sb.append(user.getId() + " " + user.getInCalls() + " "
					+ user.getInCallsCompleted() + " " + user.getOutCalls()
					+ " " + user.getOutCallsCompleted() + " "
					+ user.getDialinTimeLength() + " "
					+ user.getDialoutTimeLength() + " "
					+ user.getTransferCalls() + " "
					+ user.getTransferCallsCompleted() + "\r\n");
		}
		FileWriter fw = null;
		try {
			fw = new FileWriter(file);
			fw.write(sb.toString());
		} catch (IOException e) {
			log.log(Level.WARNING, "Save peer call file failed - " + account, e);
		} finally {
			if (fw != null)
				try {
					fw.close();
				} catch (IOException e) {
					log.log(Level.WARNING, "", e);
				}
		}
	}

	public static synchronized void loadCallReport(String pbx,
			Hashtable<String, C5Account> accounts) {
		if(accounts == null)
			return;
		
		File dir = new File("./temp_data/");
		if (!dir.exists())
			dir.mkdirs();

		File file = new File("./temp_data/" + pbx + "_"
				+ Utils.getDate("yyyy-MM-dd") + "_call");
		if (!file.exists()) {
			try {
				file.createNewFile();
			} catch (IOException e) {
				log.log(Level.WARNING, "Create call file failed", e);
				return;
			}
		}
		BufferedReader br = null;
		try {
			br = new BufferedReader(new FileReader(file));
			String line = null;
			while ((line = br.readLine()) != null) {
				String[] data = line.split(" ");
				if (data.length < 101) {
					log.warning("Error data in " + "./temp_data/" + pbx+"_"
							+ Utils.getDate("yyyy-MM-dd") + "_call: " + line);
					continue;
				} else {
					String accountId = data[0];
					C5Account account = accounts.get(accountId);
					if (account != null) {
						account.getCallReport().setInCalls(
								Integer.valueOf(data[1]));
						account.getCallReport().setInComplete(
								Integer.valueOf(data[2]));
						account.getCallReport().setOutCalls(
								Integer.valueOf(data[3]));
						account.getCallReport().setOutComplete(
								Integer.valueOf(data[4]));
						for (int i = 0; i < 24; i++) {
							account.getCallReport().setInCallsPerHour(i,
									Integer.valueOf(data[5 + i]));
						}
						for (int i = 0; i < 24; i++) {
							account.getCallReport().setInCallsCompletePerHour(i,
									Integer.valueOf(data[29 + i]));
						}
						for (int i = 0; i < 24; i++) {
							account.getCallReport().setOutCallsPerHour(i,
									Integer.valueOf(data[53 + i]));
						}
						for (int i = 0; i < 24; i++) {
							account.getCallReport().setOutCallsCompletePerHour(i,
									Integer.valueOf(data[77 + i]));
						}
					}
				}
			}
		} catch (Exception e) {
			log.log(Level.WARNING, "Read queue file failed", e);
		} finally {
			if (br != null)
				try {
					br.close();
				} catch (IOException e) {
					log.log(Level.WARNING, "", e);
				}
		}
	}

	public static synchronized void saveCallReport(String pbx,
			Hashtable<String, C5Account> accounts) {
		File dir = new File("./temp_data/");
		if (!dir.exists())
			dir.mkdirs();

		File file = new File("./temp_data/" + pbx + "_"
				+ Utils.getDate("yyyy-MM-dd") + "_call");
		if (!file.exists()) {
			try {
				file.createNewFile();
			} catch (IOException e) {
				log.log(Level.WARNING, "Create call file failed", e);
				return;
			}
		}
		StringBuffer sb = new StringBuffer();
		Iterator<C5Account> it = accounts.values().iterator();
		while (it.hasNext()) {
			C5Account account = it.next();
			sb.append(account.getAccount()
					+ " "
					+ account.getCallReport().getInCalls()
					+ " "
					+ account.getCallReport().getInComplete()
					+ " "
					+ account.getCallReport().getOutCalls()
					+ " "
					+ account.getCallReport().getOutComplete()
					+ account.getCallReport().getInCallsPerHourString()
					+ account.getCallReport().getInCallsCompletePerHourString()
					+ account.getCallReport().getOutCallsPerHourString()
					+ account.getCallReport()
							.getOutCallsCompletePerHourString() + "\r\n");
		}
		FileWriter fw = null;
		try {
			fw = new FileWriter(file);
			fw.write(sb.toString());
		} catch (IOException e) {
			log.log(Level.WARNING, "Save peer file failed - " + pbx, e);
		} finally {
			if (fw != null)
				try {
					fw.close();
				} catch (IOException e) {
					log.log(Level.WARNING, "", e);
				}
		}
	}
}
