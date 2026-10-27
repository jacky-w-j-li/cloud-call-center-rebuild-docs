package com.m7.cc.ass.gateway.config.model;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;
import java.io.FileWriter;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Timer;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.ass.config.ASConfig;
import com.m7.cc.ass.gateway.config.GWFields;
import com.m7.cc.ass.gateway.config.handler.CommonHandler;
import com.m7.cc.command.Fields;
import com.m7.cc.config.ConfPeer;
import com.m7.cc.config.ConfigProvider;
import com.m7.cc.config.Configure;
import com.m7.cc.config.ConfigureParserException;
import com.m7.cc.json.JSONReader;
import com.m7.cc.json.JSONWriter;

public class GWRuntimeData {
	private String gwPath = "./gwconf";

	private final String LINE_CONF = "line.conf";
	private final String LINE_AEL = "line.ael";
	private final String ROUTE_CONF = "route.conf";
	private final String ROUTE_AEL = "route.ael";
	private final String EXTENSION_PEER_CONF = "extensionPeer.conf";
	private final String EXTENSION_PEER_AEL = "extensionPeer.ael";
	private final String SIP_DOMAIN = "sip_domain.conf";

	private static ConfigProvider cp = new ConfigProvider();
	
	private HashMap<String, ServicePeer> peers = new HashMap<String, ServicePeer>();
	
	private HashMap<String, GWLine> gwLines = new HashMap<String, GWLine>();
	private HashMap<String, GWRoute> gwRoutes = new HashMap<String, GWRoute>();
	private HashMap<String, ExtensionPeer> extensionPeers = new HashMap<String, ExtensionPeer>();
	private SipDomain sipDomain = new SipDomain();

	protected static Timer timer = new Timer("GWRuntimeData Timer");
	private static Logger log = Logger.getLogger(GWRuntimeData.class.getName());

	private static GWRuntimeData instance = null;

	private GWRuntimeData() {
		instance = this;
		loadLine();
		loadRoute();
		loadExtensionPeer();
		loadDipDomain();
		//record uber channels count
		if(ASConfig.getInstance().getVar("uber.count.channels") != null){
			if(ASConfig.getInstance().getVar("uber.count.channels").equals("yes")){
				GWRuntimeData.timer.schedule(new UberChannelsCountTask(), new Date(), 60000);
			}
		}
	}

	public static GWRuntimeData getInstance() {
		if (instance == null) {
			new GWRuntimeData();
		}
		return instance;
	}

	public GWLine getLine(String exten) {
		return gwLines.get(exten);
	}
	
	public GWRoute getRoute(String exten) {
		return gwRoutes.get(exten);
	}
	
	public ExtensionPeer getExtensionPeer(String exten) {
		return extensionPeers.get(exten);
	}

	public SipDomain getSipDomain() {
		return sipDomain;
	}

	public void addLine(GWLine line) throws Exception {
		synchronized (gwLines) {
			gwLines.put(line.getExten(), line);
			peers.put(line.getExten(), line);
			updateLine();
		}
	}
	
	public void addRoute(GWRoute route) throws Exception {
		synchronized (gwRoutes) {
			gwRoutes.put(route.getExten(), route);
			peers.put(route.getExten(), route);
			updateRoute();
		}
	}
	
	public void addExtensionPeer(ExtensionPeer extensionPeer) throws Exception {
		synchronized (extensionPeers) {
			extensionPeers.put(extensionPeer.getExten(), extensionPeer);
			peers.put(extensionPeer.getExten(), extensionPeer);
			updateExtensionPeer();
		}
	}

	public void removeLine(String exten) throws Exception {
		synchronized (gwLines) {
			gwLines.remove(exten);
			peers.remove(exten);
			updateLine();
		}
	}
	
	public void removeRoute(String exten) throws Exception {
		synchronized (gwRoutes) {
			gwRoutes.remove(exten);
			peers.remove(exten);
			updateRoute();
		}
	}
	
	public void removeExtensionPeer(String exten) throws Exception {
		synchronized (extensionPeers) {
			extensionPeers.remove(exten);
			peers.remove(exten);
			updateExtensionPeer();
		}
	}

	public void effectAll() throws Exception {
		effectLine();
		effectRoute();
		effectExtensionPeer();
		CommonHandler.reload();
	}

	public void effect(String peer) throws Exception {
		if (peer.equals(GWFields.GWLine)) {
			effectLine();
		} else if (peer.equals(GWFields.GWRoute)) {
			effectRoute();
		} else if (peer.equals(Fields.ExtensionPeer)) {
			effectExtensionPeer();
		}
	}

	public void effectLine() throws Exception {
		synchronized (gwLines) {
			File dir = new File(ASConfig.getInstance().getConfigPath()
					+ "/gateway/");
			if(!dir.exists())
				dir.mkdirs();
			File file = new File(ASConfig.getInstance().getConfigPath()
					+ "/gateway/" + LINE_AEL);
			if (!file.exists())
				file.createNewFile();
			String data = "";
			Iterator<GWLine> qs = gwLines.values().iterator();
			while (qs.hasNext()) {
				GWLine line = qs.next();
				String vm = ASConfig.getInstance().getVmLine();
				vm = vm.replaceAll("_exten", line.getExten());
				vm = vm.replaceAll("_ip", line.getIp());
				vm = vm.replaceAll("_port", line.getPort() + "");
				data += vm + "\n";
			}
			FileWriter fw = new FileWriter(file);
			try{
				fw.write(data);
				fw.flush();
			} catch (Exception e){
				log.log(Level.WARNING, "", e);
			} finally {
				fw.close();
			}
		}
	}
	
	public void effectRoute() throws Exception {
		synchronized (gwLines) {
			File dir = new File(ASConfig.getInstance().getConfigPath()
					+ "/gateway/");
			if(!dir.exists())
				dir.mkdirs();
			File file = new File(ASConfig.getInstance().getConfigPath()
					+ "/gateway/" + ROUTE_AEL);
			if (!file.exists())
				file.createNewFile();
			String data = "";
			Iterator<GWRoute> qs = gwRoutes.values().iterator();
			while (qs.hasNext()) {
				GWRoute route = qs.next();
				String vm = ASConfig.getInstance().getVmRoute();
				vm = vm.replaceAll("_exten", route.getExten());
				String nextPeer = route.getNextPeer();
				String toString = "Hangup";
				if(nextPeer != null){
					ServicePeer peer = peers.get(nextPeer);
					if(peer != null)
						toString = peer.getActionString();
				}
				vm = vm.replaceAll("_nextPeer", toString);
				data += vm + "\n";
			}
			FileWriter fw = new FileWriter(file);
			try{
				fw.write(data);
				fw.flush();
			} catch (Exception e){
				log.log(Level.WARNING, "", e);
			} finally {
				fw.close();
			}
		}
	}
	
	public void effectExtensionPeer() throws Exception {
		synchronized (extensionPeers) {
			File dir = new File(ASConfig.getInstance().getConfigPath()
					+ "/gateway/");
			if(!dir.exists())
				dir.mkdirs();
			File file = new File(ASConfig.getInstance().getConfigPath()
					+ "/gateway/" + EXTENSION_PEER_AEL);
			if (!file.exists())
				file.createNewFile();
			String data = "";
			Iterator<ExtensionPeer> qs = extensionPeers.values().iterator();
			while (qs.hasNext()) {
				ExtensionPeer ePeer = qs.next();
//				String vm = ASConfig.getInstance().getVmExtensionPeer();
//				vm = vm.replaceAll("_exten", ePeer.getExten());
//				vm = vm.replaceAll("_dialplan", ePeer.getDialplan());
				String vm = ePeer.getDialplan();
				data += vm + "\n";
			}
			FileWriter fw = new FileWriter(file);
			try{
				fw.write(data);
				fw.flush();
			} catch (Exception e){
				log.log(Level.WARNING, "", e);
			} finally {
				fw.close();
			}
		}
	}

	private void updateLine() throws Exception {
		File conf = new File(gwPath);
		if (!conf.exists()) {
			conf.mkdirs();
		}
		String fileName = gwPath + "/" + LINE_CONF;
		Configure config = new Configure(fileName);
		Iterator<GWLine> bls = gwLines.values().iterator();
		while (bls.hasNext()) {
			GWLine line = bls.next();
			ConfPeer peer = new ConfPeer(line.getExten());

			peer.addParam(Fields.DisplayName, line.getDisplayName());
			peer.addParam(Fields.Address, line.getIp());
			peer.addParam(Fields.Port, line.getPort() + "");
			config.addPeer(peer);
		}
		cp.save(config);
	}
	
	private void updateRoute() throws Exception {
		File conf = new File(gwPath);
		if (!conf.exists()) {
			conf.mkdirs();
		}
		String fileName = gwPath + "/" + ROUTE_CONF;
		Configure config = new Configure(fileName);
		Iterator<GWRoute> bls = gwRoutes.values().iterator();
		while (bls.hasNext()) {
			GWRoute route = bls.next();
			ConfPeer peer = new ConfPeer(route.getExten());

			peer.addParam(Fields.DisplayName, route.getDisplayName());
			if(route.getNextPeer() != null)
				peer.addParam(Fields.NextPeer, route.getNextPeer());
			config.addPeer(peer);
		}
		cp.save(config);
	}
	
	private void updateExtensionPeer() throws Exception {
		File conf = new File(gwPath);
		if (!conf.exists()) {
			conf.mkdirs();
		}
		String fileName = gwPath + "/" + EXTENSION_PEER_CONF;
		Configure config = new Configure(fileName);
		Iterator<ExtensionPeer> bls = extensionPeers.values().iterator();
		while (bls.hasNext()) {
			ExtensionPeer epeer = bls.next();
			ConfPeer peer = new ConfPeer(epeer.getExten());
			JSONWriter jw = new JSONWriter();
			peer.addParam(Fields.DialPlan, jw.write(epeer.getDialplan()));
			if (epeer.getDisplayName() != null)
				peer.addParam(Fields.DisplayName, epeer.getDisplayName());
			config.addPeer(peer);
		}
		try {
			cp.save(config);
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}
	}
	
	public void updateSipDomain() throws Exception {
		File dir = new File(ASConfig.getInstance().getConfigPath()
				+ "/gateway/");
		if(!dir.exists())
			dir.mkdirs();
		File file = new File(ASConfig.getInstance().getConfigPath()
				+ "/gateway/" + SIP_DOMAIN);
		if (!file.exists())
			file.createNewFile();
		
		FileWriter fw = new FileWriter(file);
		try{
			List<String> list = sipDomain.getDomains();
			for(int i=0;i<list.size();i++){
				fw.write("domain="+list.get(i)+"\n");
			}
			fw.flush();
		} catch (Exception e){
			log.log(Level.WARNING, "", e);
		} finally {
			fw.close();
		}
		
	}
	public void removeSipDomain() throws IOException {
		File dir = new File(ASConfig.getInstance().getConfigPath()
				+ "/gateway/");
		if(!dir.exists()){
			log.log(Level.WARNING, "domain dir is not exist!");
			return;
		}
		File file = new File(ASConfig.getInstance().getConfigPath()
				+ "/gateway/" + SIP_DOMAIN);
		if (!file.exists()){
			log.log(Level.WARNING, "domain file is not exist!");
			return;
		}
		BufferedReader reader=null;
		FileWriter fw=null;
		try{
			reader=new BufferedReader(new FileReader(file));
			String lineStr=null;
			List<String> domainList=new ArrayList<String>();
			while((lineStr=reader.readLine())!=null){
				if(!lineStr.contains(sipDomain.getRemoveDomain())){
					domainList.add(lineStr);
				}
			}
			fw = new FileWriter(file);
			for(int i=0;i<domainList.size();i++){
				fw.write(domainList.get(i));
			}
			fw.flush();
		}catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}finally{
			reader.close();
			fw.close();
		}
		
	}
	private void loadDipDomain(){
		try{
			File dir = new File(ASConfig.getInstance().getConfigPath()
					+ "/gateway/");
			if(!dir.exists())
				dir.mkdirs();
			File file = new File(ASConfig.getInstance().getConfigPath()
					+ "/gateway/" + SIP_DOMAIN);
			if (!file.exists()){
				file.createNewFile();
				return;
			}
			
			FileReader fr = new FileReader(file);
			BufferedReader br = new BufferedReader(fr);
			String line = null;
			List<String> domains = new ArrayList<String>();
			while((line = br.readLine()) != null) {
				line = line.trim();
				if(line.matches("domain=[0-9]+\\.[0-9]+\\.[0-9]+\\.[0-9]+")){
					domains.add(line.substring(7));
				}
			}
			this.sipDomain.setDomains(domains);
		} catch (Exception e){
			log.log(Level.WARNING, "", e);
		}
		
	}
	
	private void loadLine() {
		synchronized (gwLines) {
			try {
				Configure conf = cp.parser(gwPath + "/" + LINE_CONF);
				ConfPeer[] peers = conf.getAllPeers();
				if (peers != null && peers.length > 0) {
					for (int i = 0; i < peers.length; i++) {
						ConfPeer p = peers[i];
						String id = p.getName();
						GWLine line = new GWLine(id);
						if(p.contain(Fields.DisplayName))
							line.setDisplayName(p.getParam(Fields.DisplayName));
						line.setIp(p.getParam(Fields.Address));
						line.setPort(p.getParam(Fields.Port));
						gwLines.put(id, line);
						this.peers.put(id, line);
					}
				}
			} catch (Exception e) {
//				log.log(Level.WARNING, "", e);
			}
		}
	}
	
	private void loadRoute() {
		synchronized (gwRoutes) {
			try {
				Configure conf = cp.parser(gwPath + "/" + ROUTE_CONF);
				ConfPeer[] peers = conf.getAllPeers();
				if (peers != null && peers.length > 0) {
					for (int i = 0; i < peers.length; i++) {
						ConfPeer p = peers[i];
						String id = p.getName();
						GWRoute route = new GWRoute(id);
						if(p.contain(Fields.DisplayName))
							route.setDisplayName(p.getParam(Fields.DisplayName));
						if(p.contain(Fields.NextPeer))
							route.setNextPeer(p.getParam(Fields.NextPeer));
						gwRoutes.put(id, route);
						this.peers.put(id, route);
					}
				}
			} catch (Exception e) {
//				log.log(Level.WARNING, "", e);
			}
		}
	}
	
	private void loadExtensionPeer() {
		synchronized (extensionPeers) {
			try {
				Configure conf = cp.parser(gwPath + "/" + EXTENSION_PEER_CONF);
				ConfPeer[] peers = conf.getAllPeers();
				JSONReader jr = new JSONReader();
				if (peers != null && peers.length > 0) {
					for (int i = 0; i < peers.length; i++) {
						ConfPeer p = peers[i];
						ExtensionPeer ant = new ExtensionPeer(p.getName());
						ant.setDialplan((String) jr.read(p
								.getParam(Fields.DialPlan)));
						if (p.contain(Fields.DisplayName))
							ant.setDisplayName(p.getParam(Fields.DisplayName));

						extensionPeers.put(ant.getExten(), ant);
						this.peers.put(ant.getExten(), ant);
					}
				}
			} catch (ConfigureParserException e) {
				// log.log(Level.WARNING, "", e);
			} catch (Exception e) {
				log.log(Level.WARNING, "", e);
			}
		}
	}

	
}
