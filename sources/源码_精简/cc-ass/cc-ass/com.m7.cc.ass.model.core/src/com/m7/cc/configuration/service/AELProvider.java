package com.m7.cc.configuration.service;

import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.File;
import java.io.FileOutputStream;
import java.io.FileReader;
import java.io.IOException;
import java.io.OutputStreamWriter;
import java.io.Writer;
import java.util.Hashtable;
import java.util.Iterator;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.ass.config.ASConfig;
import com.m7.cc.ass.model.C5Account;
import com.m7.cc.ass.model.configuration.Announcement;
import com.m7.cc.ass.model.configuration.AssignmentNode;
import com.m7.cc.ass.model.configuration.BlackList;
import com.m7.cc.ass.model.configuration.C5Queue;
import com.m7.cc.ass.model.configuration.CallUrl;
import com.m7.cc.ass.model.configuration.DialJobNumNode;
import com.m7.cc.ass.model.configuration.DialLine;
import com.m7.cc.ass.model.configuration.DialextenNode;
import com.m7.cc.ass.model.configuration.DynamicRouteNode;
import com.m7.cc.ass.model.configuration.EncryptMD5;
import com.m7.cc.ass.model.configuration.ExtensionPeer;
import com.m7.cc.ass.model.configuration.IVR;
import com.m7.cc.ass.model.configuration.IvrMenu;
import com.m7.cc.ass.model.configuration.IvrValidateNode;
import com.m7.cc.ass.model.configuration.Room;
import com.m7.cc.ass.model.configuration.Satisfaction;
import com.m7.cc.ass.model.configuration.ServiceNo;
import com.m7.cc.ass.model.configuration.SuperDialJobNum;
import com.m7.cc.ass.model.configuration.TextAnnouncement;
import com.m7.cc.ass.model.configuration.TimeCondition;
import com.m7.cc.ass.model.configuration.TwowayCall;
import com.m7.cc.ass.model.configuration.Validation;
import com.m7.cc.ass.model.configuration.Voicemail;
import com.m7.cc.configuration.service.template.AnnouncementTemplate;
import com.m7.cc.configuration.service.template.AssignmentNodeTemplate;
import com.m7.cc.configuration.service.template.BlackListTemplate;
import com.m7.cc.configuration.service.template.CallUrlTemplate;
import com.m7.cc.configuration.service.template.DialJobNumNodeTemplate;
import com.m7.cc.configuration.service.template.DialextenNodeTemplate;
import com.m7.cc.configuration.service.template.DialoutTemplate;
import com.m7.cc.configuration.service.template.DynamicRouteNodeTemplate;
import com.m7.cc.configuration.service.template.EncryptMD5Template;
import com.m7.cc.configuration.service.template.ExtensionPeerTemplate;
import com.m7.cc.configuration.service.template.ExtensionsTemplate;
import com.m7.cc.configuration.service.template.IvrMenuTemplate;
import com.m7.cc.configuration.service.template.IvrTemplate;
import com.m7.cc.configuration.service.template.IvrValidateNodeTemplate;
import com.m7.cc.configuration.service.template.QueueTemplate;
import com.m7.cc.configuration.service.template.RoomTemplate;
import com.m7.cc.configuration.service.template.SatisfactionTemplate;
import com.m7.cc.configuration.service.template.ServiceNoTemplate;
import com.m7.cc.configuration.service.template.SuperDialJobNumTemplate;
import com.m7.cc.configuration.service.template.TempFields;
import com.m7.cc.configuration.service.template.TextAnnouncementTemplate;
import com.m7.cc.configuration.service.template.TimeConditionTemplate;
import com.m7.cc.configuration.service.template.TwowayCallTemplate;
import com.m7.cc.configuration.service.template.ValidateTemplate;
import com.m7.cc.configuration.service.template.VoicemailTemplate;

public class AELProvider {
	public static final String QUEUES = "queues.conf";
	public static final String SIP = "sip.conf";
	public static final String MOH = "moh.conf";

	public static final String INCLUDE = "include.ael";
	public static final String EXTENSION = "extensions.ael";
	public static final String CALL_ROUTE = "callroute.ael";
	public static final String SERVICE_NO = "serviceno.ael";
	public static final String BLACK_LIST = "blacklist.ael";
	public static final String VOICEMAIL = "voicemail.ael";
	public static final String EXTENSION_PEER = "extension_peer.ael";
	public static final String ANNOUNCEMENT = "announcement.ael";
	//-----------------------------
	public static final String SATISFACTION = "satisfaction.ael";
	public static final String SUPERDIALJOBNUM = "superDialJobNum.ael";
	public static final String IVRMENU = "ivr_menu.ael";
	public static final String VALIDATE = "validate.ael";
	public static final String IVR = "ivr.ael";
	public static final String DYNAMICROUTE = "dynamicroute.ael";
	public static final String ASSIGNMENT = "assignment.ael";
	public static final String DIALJOBNUM = "dialjobnum.ael";
	public static final String IVRVALIDATE = "ivr_validate.ael";
	
	public static final String DIALEXTEN = "dialexten.ael"; // Aman zhai. 2010.06.09
	public static final String TERMINATE_CALL = "terminatecall.ael";
	public static final String TIME_CONDITION = "time_condition.ael";
	public static final String CALL_URL = "callurl.ael";
	public static final String TWOWAY_CALL = "twowaycall.ael";
	public static final String TEXT_ANNOUNCEMENT = "text_announcement.ael";
	public static final String ENCRYPT_MD5 = "encrypt_md5.ael";
	public static final String WEB_CALL = "webcall.ael";
	public static final String QUEUE = "queue.ael";
	public static final String DIALOUT = "dialout.ael";
	public static final String ROOM = "room.ael";

	public static final String INCLUDE_EXTENSION = "extensions_include.ael";
	public static final String INCLUDE_QUEUES = "queues_include.conf";
	public static final String INCLUDE_SIP = "sip_include.conf";
	public static final String INCLUDE_MUSICONHOLD = "musiconhold_include.conf";

	private static final Logger log = Logger.getLogger(AELProvider.class
			.getName());

	public static void updateExtension(String pbx, C5Account account)
			throws Exception {
		File file = newFile(pbx, account.getAccount(), EXTENSION);
		if(file == null){
			throw new Exception("create file failure:" + EXTENSION);
		}
		
		String data = ExtensionsTemplate.create(pbx, account);
		if(!writeFile(file, data)){
			throw new Exception("write data into file failure:" + EXTENSION);
		}
		
		data = null;
	}
	
	private static void concatAELInclude(StringBuffer buffer, String account,
			String AELFileName){
		buffer.append("#include \"accounts/")
			  .append(account)
			  .append("/")
			  .append(AELFileName)
			  .append("\"")
			  .append(TempFields.UNIX_ENDLINE);
	}

	public static void updateInclude(String pbx, String account)
			throws Exception {
		File include = newFile(pbx, account, INCLUDE);
		if(include == null){
			throw new Exception("create file failure:" + INCLUDE);
		}

		StringBuffer buffer = new StringBuffer();
		concatAELInclude(buffer, account, EXTENSION);
		concatAELInclude(buffer, account, CALL_ROUTE);
		concatAELInclude(buffer, account, SERVICE_NO);
		concatAELInclude(buffer, account, BLACK_LIST);
		concatAELInclude(buffer, account, VOICEMAIL);
		concatAELInclude(buffer, account, ANNOUNCEMENT);
		concatAELInclude(buffer, account, VALIDATE);
		concatAELInclude(buffer, account, IVR);
		concatAELInclude(buffer, account, TIME_CONDITION);
		concatAELInclude(buffer, account, WEB_CALL);
		concatAELInclude(buffer, account, QUEUE);
		concatAELInclude(buffer, account, DIALOUT);
		concatAELInclude(buffer, account, EXTENSION_PEER);
		concatAELInclude(buffer, account, DIALEXTEN);
		concatAELInclude(buffer, account, DYNAMICROUTE);
		concatAELInclude(buffer, account, ASSIGNMENT);
		concatAELInclude(buffer, account, DIALJOBNUM);
		concatAELInclude(buffer, account, CALL_URL);
		concatAELInclude(buffer, account, TWOWAY_CALL);
		concatAELInclude(buffer, account, TEXT_ANNOUNCEMENT);
		concatAELInclude(buffer, account, ENCRYPT_MD5);
		concatAELInclude(buffer, account, ROOM);
		concatAELInclude(buffer, account, SATISFACTION);
		concatAELInclude(buffer, account, IVRVALIDATE);
		concatAELInclude(buffer, account, IVRMENU);
		concatAELInclude(buffer, account, SUPERDIALJOBNUM);
		
		if(!writeFile(include, buffer.toString())){
			throw new Exception("write data into file failure:" + INCLUDE);
		}
		buffer = null;

		newFile(pbx, account, EXTENSION);
		newFile(pbx, account, CALL_ROUTE);
		newFile(pbx, account, SERVICE_NO);
		newFile(pbx, account, BLACK_LIST);
		newFile(pbx, account, VOICEMAIL);
		newFile(pbx, account, ANNOUNCEMENT);
		newFile(pbx, account, VALIDATE);
		newFile(pbx, account, IVR);
		newFile(pbx, account, TIME_CONDITION);
		newFile(pbx, account, WEB_CALL);
		newFile(pbx, account, QUEUE);
		newFile(pbx, account, DIALOUT);
		newFile(pbx, account, EXTENSION_PEER);
		newFile(pbx, account, DIALEXTEN); // Aman zhai. 2010.06.09
		newFile(pbx, account, DYNAMICROUTE); // Aman zhai. 2010.06.11
		newFile(pbx, account, TEXT_ANNOUNCEMENT);
		newFile(pbx, account, ENCRYPT_MD5);
		newFile(pbx, account, ROOM);
		newFile(pbx, account, TWOWAY_CALL);
		newFile(pbx, account, SATISFACTION);
		newFile(pbx, account, IVRVALIDATE);
		newFile(pbx, account, IVRMENU);
	}

	public static void removeInclude(String pbx, String account)
			throws Exception {
		removeInclude(pbx, account, INCLUDE_EXTENSION, INCLUDE);
		removeInclude(pbx, account, INCLUDE_SIP, SIP);
		removeInclude(pbx, account, INCLUDE_QUEUES, QUEUES);
		removeInclude(pbx, account, INCLUDE_MUSICONHOLD, MOH);
	}

	public static void addInclude(String pbx, String account) throws Exception {
		// Add configuration files of this account to asterisk
		writeIncludeFile(pbx, account, INCLUDE_EXTENSION, INCLUDE);
		writeIncludeFile(pbx, account, INCLUDE_SIP, SIP);
		writeIncludeFile(pbx, account, INCLUDE_QUEUES, QUEUES);
		writeIncludeFile(pbx, account, INCLUDE_MUSICONHOLD, MOH);
	}

	private static void writeIncludeFile(String pbx, String account,
			String file, String type) throws Exception {
		File include = newFile(pbx, file);
		if(include == null){
			throw new IOException("create file failure:" + file);
		}

		BufferedReader br = new BufferedReader(new FileReader(include));
		String data = "";
		String line = null;
		while ((line = br.readLine()) != null) {
			if (line.startsWith("#include")) {
				String[] a = line.split("/");
				if (a[1].equals(account))
					continue;
				data += line + TempFields.UNIX_ENDLINE;
			}
		}
		data += "#include \"accounts/" + account + "/" + type + "\"";
		br.close();
		if(!writeFile(include, data)){
			throw new IOException("write file failure:" + file);
		}
		line = null;
		data = null;
	}

	private static void removeInclude(String pbx, String account, String file,
			String type) throws Exception {
		File include = newFile(pbx, file);
		if(include == null){
			throw new IOException("create file failure:" + file);
		}

		BufferedReader br = new BufferedReader(new FileReader(include));
		String data = "";
		String line = null;
		while ((line = br.readLine()) != null) {
			String[] a = line.split("/");
			if (a[1].equals(account))
				continue;
			data += line + TempFields.UNIX_ENDLINE;
		}
		br.close();
		
		if(!writeFile(include, data)){
			throw new Exception("write data into file failure:" + file);
		}
		data = null;
	}

	public static File newFile(String pbx, String fileName){
		return newFile(pbx, null, fileName);
	}
	private static File newFile(String pbx, String account, String fileName){
		String filePath = ASConfig.getInstance().getConfigPath() + "/" + pbx + "/";
		if(account != null && !"".equals(account)){
			filePath += "accounts/" + account + "/";
		}
		filePath += fileName;
		
		File file = new File(filePath);
		if (!file.exists()){
			try {
				file.createNewFile();
			} catch (IOException e) {
				log.log(Level.WARNING, "Create file :" + fileName + " failure.", e);
				return null;
			}
		}
		
		filePath = null;
		fileName = null;
		return file;
	}

	public static void updateCallRoute(String pbx, String account,
			Hashtable<String, ServicePeer> callRoutes) throws Exception {
		File route = newFile(pbx, account, CALL_ROUTE);
		if(route == null){
			throw new IOException("create file failure:" + CALL_ROUTE);
		}
		
		String data = "context " + account + "-route {"
				+ TempFields.UNIX_ENDLINE;
		Iterator<ServicePeer> it = callRoutes.values().iterator();
		while (it.hasNext()) {
			ServicePeer cr = it.next();
			if (cr.getExten() == null || "".equals(cr.getExten()))
				continue;
			String temp = "tempString";
			data += "\t" + cr.getExten() + " => " + temp + ";"
					+ TempFields.UNIX_ENDLINE;
			data = data.replaceAll(temp, cr.getActionString());
		}
		
		data += "\t_XXXX => {" + TempFields.UNIX_ENDLINE + "\t\tJOBNUM=${EXTEN};"
				+ TempFields.UNIX_ENDLINE + "\t\tgoto " + account + "-dialin,${EXTEN},1;"
				+ TempFields.UNIX_ENDLINE +"\t}" + TempFields.UNIX_ENDLINE;
		data += "\t_X.=> {" + TempFields.UNIX_ENDLINE + "\t\tgoto " + account
				+ "-dial,${EXTEN},1;" + TempFields.UNIX_ENDLINE + "\t}"
				+ TempFields.UNIX_ENDLINE;
		data += "}";
		
		if(!writeFile(route, data)){
			throw new IOException("write data into file failure:" + CALL_ROUTE);
		}
		data = null;
	}

	public static void updateQueue(Hashtable<String, C5Queue> queues,
			C5Account account) throws Exception {
		if (queues == null)
			return;
		
		File file = newFile(account.getPbx(), account.getAccount(), QUEUE);
		if(file == null){
			throw new IOException("create file failure:" + QUEUE);
		}
		
		String data = "";
		Iterator<C5Queue> qs = queues.values().iterator();
		while (qs.hasNext()) {
			C5Queue queue = qs.next();
			data += QueueTemplate.create(account, queue)
					+ TempFields.UNIX_ENDLINE;
		}

		if(!writeFile(file, data)){
			throw new IOException("write data into file failure:" + QUEUE);
		}
		data = null;
	}

	public static boolean updateServiceNo(
			Hashtable<String, ServiceNo> serviceNos, C5Account account) throws Exception{
		if (serviceNos == null)
			return false;
		
		File file = newFile(account.getPbx(), account.getAccount(), SERVICE_NO);
		if(file == null){
			return false;
		}
		
		String data = "";
		Iterator<ServiceNo> sns = serviceNos.values().iterator();
		while (sns.hasNext()) {
			ServiceNo sn = sns.next();
			data += ServiceNoTemplate.create(account, sn)
					+ TempFields.UNIX_ENDLINE;
		}

		if(!writeFile(file, data)){
			return false;
		}
		data = null;
		return true;
	}

	public static boolean updateBlackList(
			Hashtable<String, BlackList> blackLists, C5Account account){
		File file = newFile(account.getPbx(), account.getAccount(), BLACK_LIST);
		if(file == null){
			return false;
		}

		String content = "";

		Iterator<BlackList> bls = blackLists.values().iterator();
		while (bls.hasNext()) {
			BlackList bl = bls.next();
			content += BlackListTemplate.newcreate(account, bl) + TempFields.UNIX_ENDLINE;
		}

		if(!writeFile(file, content)){
			return false;
		}
		content = null;
		return true;
	}

	public static boolean updateTimeCondition(
			Hashtable<String, TimeCondition> timeConditions, C5Account account) {
		File file = newFile(account.getPbx(), account.getAccount(), TIME_CONDITION);
		if(file == null){
			return false;
		}

		String content = "";
		Iterator<TimeCondition> tcs = timeConditions.values().iterator();
		
		try {
			while (tcs.hasNext()) {
				TimeCondition tc = tcs.next();
				content += TimeConditionTemplate.create(account, tc)
						+ TempFields.UNIX_ENDLINE;
			}
		} catch (IOException e) {
			log.log(Level.WARNING, "", e);
			return false;
		}

		if(!writeFile(file, content)){
			return false;
		}
		content = null;
		return true;
	}

	public static boolean updateIVR(Hashtable<String, IVR> ivrs,
			C5Account account) {
		File file = newFile(account.getPbx(), account.getAccount(), IVR);
		if(file == null){
			return false;
		}

		String content = "";
		Iterator<IVR> tcs = ivrs.values().iterator();
		try{
			while (tcs.hasNext()) {
				IVR tc = tcs.next();
				content += IvrTemplate.create(account, tc) + TempFields.UNIX_ENDLINE;
			}
		}catch(Exception e){
			log.log(Level.WARNING, "", e);
			return false;
		}

		if(!writeFile(file, content)){
			return false;
		}
		content = null;
		return true;
	}

	public static boolean updateSatisfaction(
			Hashtable<String, Satisfaction> ants, C5Account account) {
		File file = newFile(account.getPbx(), account.getAccount(), SATISFACTION);
		if(file == null){
			return false;
		}

		String content = "";
		Iterator<Satisfaction> tcs = ants.values().iterator();
		try{
			while (tcs.hasNext()) {
				Satisfaction tc = tcs.next();
				content += SatisfactionTemplate.create(account, tc) + TempFields.UNIX_ENDLINE;
			}
		}catch(IOException e){
			log.log(Level.WARNING, "", e);
			return false;
		}

		if(!writeFile(file, content)){
			return false;
		}
		content = null;
		return true;
	}

	public static boolean updateSuperDialJobNum(
			Hashtable<String, SuperDialJobNum> ants, C5Account account) {
		File file = newFile(account.getPbx(), account.getAccount(), SUPERDIALJOBNUM);
		if(file == null){
			return false;
		}

		String content = "";
		Iterator<SuperDialJobNum> tcs = ants.values().iterator();
		try{
			while (tcs.hasNext()) {
				SuperDialJobNum tc = tcs.next();
				content += SuperDialJobNumTemplate.create(account, tc) + TempFields.UNIX_ENDLINE;
			}
		}catch(IOException e){
			log.log(Level.WARNING, "", e);
			return false;
		}

		if(!writeFile(file, content)){
			return false;
		}
		content = null;
		return true;
	}
	
	public static boolean updateAnnouncement(
			Hashtable<String, Announcement> ants, C5Account account) {
		File file = newFile(account.getPbx(), account.getAccount(), ANNOUNCEMENT);
		if(file == null){
			return false;
		}

		String content = "";
		Iterator<Announcement> tcs = ants.values().iterator();
		try{
			while (tcs.hasNext()) {
				Announcement tc = tcs.next();
				content += AnnouncementTemplate.create(account, tc) + TempFields.UNIX_ENDLINE;
			}
		}catch(IOException e){
			log.log(Level.WARNING, "", e);
			return false;
		}

		if(!writeFile(file, content)){
			return false;
		}
		content = null;
		return true;
	}
	
	public static boolean updateIvrMenu(Hashtable<String, IvrMenu> ants, C5Account account) {
		File file = newFile(account.getPbx(), account.getAccount(), IVRMENU);
		if(file == null){
			return false;
		}

		String content = "";
		Iterator<IvrMenu> tcs = ants.values().iterator();
		try{
			while (tcs.hasNext()) {
				IvrMenu tc = tcs.next();
				if(tc.getMenuType().equalsIgnoreCase("inner")){
					content += IvrMenuTemplate.create(account, tc) + TempFields.UNIX_ENDLINE;					
				}
			}
		}catch(IOException e){
			log.log(Level.WARNING, "", e);
			return false;
		}

		if(!writeFile(file, content)){
			return false;
		}
		content = null;
		return true;
	}
	
	public static boolean updateCallUrl(Hashtable<String, CallUrl> callUrls, C5Account account) {
		File file = newFile(account.getPbx(), account.getAccount(), CALL_URL);
		if(file == null){
			return false;
		}

		String content = "";
		Iterator<CallUrl> tcs = callUrls.values().iterator();
		try {
			while (tcs.hasNext()) {
				CallUrl tc = tcs.next();
				content += CallUrlTemplate.create(account, tc)
						+ TempFields.UNIX_ENDLINE;
			}
		} catch (IOException e) {
			log.log(Level.WARNING, "", e);
			return false;
		}

		if(!writeFile(file, content)){
			return false;
		}
		content = null;
		return true;
	}
	
	public static boolean updateTwowayCall(Hashtable<String, TwowayCall> twowayCalls, C5Account account) {
		File file = newFile(account.getPbx(), account.getAccount(), TWOWAY_CALL);
		if(file == null){
			return false;
		}

		String content = "";
		Iterator<TwowayCall> tcs = twowayCalls.values().iterator();
		try {
			while (tcs.hasNext()) {
				TwowayCall tc = tcs.next();
				content += TwowayCallTemplate.create(account, tc)
						+ TempFields.UNIX_ENDLINE;
			}
		} catch (IOException e) {
			log.log(Level.WARNING, "", e);
			return false;
		}

		if(!writeFile(file, content)){
			return false;
		}
		content = null;
		return true;
	}
	
	public static boolean updateEncryptMD5(Hashtable<String, EncryptMD5> encryptMD5s, C5Account account) {
		File file = newFile(account.getPbx(), account.getAccount(), ENCRYPT_MD5);
		if(file == null){
			return false;
		}

		String content = "";
		Iterator<EncryptMD5> ems = encryptMD5s.values().iterator();
		try{
			while (ems.hasNext()) {
				EncryptMD5 em = ems.next();
				content += EncryptMD5Template.create(account, em) + TempFields.UNIX_ENDLINE;
			}
		}catch(IOException e){
			log.log(Level.WARNING, "", e);
			return false;
		}

		if(!writeFile(file, content)){
			return false;
		}
		content = null;
		
		return true;
	}
	
	public static boolean updateRoom(Hashtable<String, Room> rooms, C5Account account) {
		File file = newFile(account.getPbx(), account.getAccount(), ROOM);
		if(file == null){
			return false;
		}

		String content = "";
		Iterator<Room> roomIte = rooms.values().iterator();
		try{
			Room room = null;
			while (roomIte.hasNext()) {
				room = roomIte.next();
				content += RoomTemplate.create(account, room) + TempFields.UNIX_ENDLINE;
			}
		}catch(IOException e){
			log.log(Level.WARNING, "", e);
			return false;
		}

		if(!writeFile(file, content)){
			return false;
		}
		content = null;
		
		return true;
	}
	
	public static boolean updateTextAnnouncement(Hashtable<String, TextAnnouncement> textAnnouncements, C5Account account) {
		File file = newFile(account.getPbx(), account.getAccount(), TEXT_ANNOUNCEMENT);
		
		if(file == null){
			return false;
		}

		String content = "";
		Iterator<TextAnnouncement> tcs = textAnnouncements.values().iterator();
		try {
			while (tcs.hasNext()) {
				TextAnnouncement tc = tcs.next();
				content += TextAnnouncementTemplate.create(account, tc)
						+ TempFields.UNIX_ENDLINE;
			}
		} catch (IOException e) {
			log.log(Level.WARNING, "", e);
			return false;
		}

		if(!writeFile(file, content)){
			return false;
		}
		content = null;
		
		return true;
	}

	public static boolean updateValidate(Hashtable<String, Validation> ants,
			C5Account account) {
		File file = newFile(account.getPbx(), account.getAccount(), VALIDATE);
		if(file == null){
			return false;
		}

		String content = "";
		Iterator<Validation> tcs = ants.values().iterator();
		try {
			while (tcs.hasNext()) {
				Validation tc = tcs.next();
				content += ValidateTemplate.create(account, tc)
						+ TempFields.UNIX_ENDLINE;
			}
		} catch (IOException e) {
			log.log(Level.WARNING, "", e);
			return false;
		}

		if(!writeFile(file, content)){
			return false;
		}
		content = null;
		return true;
	}

	public static boolean updateVoicemail(Hashtable<String, Voicemail> ants,
			C5Account account) {
		File file = newFile(account.getPbx(), account.getAccount(), VOICEMAIL);
		if(file == null){
			return false;
		}

		String content = "";
		Iterator<Voicemail> tcs = ants.values().iterator();
		try {
			while (tcs.hasNext()) {
				Voicemail tc = tcs.next();
				content += VoicemailTemplate.create(account, tc)
						+ TempFields.UNIX_ENDLINE;
			}
		} catch (IOException e) {
			log.log(Level.WARNING, "", e);
			return false;
		}

		if(!writeFile(file, content)){
			return false;
		}
		content = null;
		return true;
	}
	
	public static boolean updateDialJobNumNodes(
			Hashtable<String, DialJobNumNode> dialJobNumNodes, C5Account account){

		File file = newFile(account.getPbx(), account.getAccount(), DIALJOBNUM);
		if(file == null){
			return false;
		}

		String content = "";
		Iterator<DialJobNumNode> tcs = dialJobNumNodes.values().iterator();
		try {
			while (tcs.hasNext()) {
				DialJobNumNode tc = tcs.next();
				content += DialJobNumNodeTemplate.create(account, tc)
						+ TempFields.UNIX_ENDLINE;
			}
		} catch (IOException e) {
			log.log(Level.WARNING, "", e);
			return false;
		}

		if(!writeFile(file, content)){
			return false;
		}
		content = null;
		return true;
	
	}
	//add by chenguang 2012-22-8
	public static boolean updateIvrValidateNodes(
			Hashtable<String, IvrValidateNode> ivrValidateNodes, C5Account account){

		File file = newFile(account.getPbx(), account.getAccount(), IVRVALIDATE);
		if(file == null){
			return false;
		}

		String content = "";
		Iterator<IvrValidateNode> tcs = ivrValidateNodes.values().iterator();
		try {
			while (tcs.hasNext()) {
				IvrValidateNode tc = tcs.next();
				content += IvrValidateNodeTemplate.create(account, tc)
						+ TempFields.UNIX_ENDLINE;
			}
		} catch (IOException e) {
			log.log(Level.WARNING, "", e);
			return false;
		}

		if(!writeFile(file, content)){
			return false;
		}
		content = null;
		return true;
	}
	
	// Aman zhai. 2010.07.24
	public static boolean updateAssignmentNodes(
			Hashtable<String, AssignmentNode> assignmentNodes, C5Account account){

		File file = newFile(account.getPbx(), account.getAccount(), ASSIGNMENT);
		if(file == null){
			return false;
		}

		String content = "";
		Iterator<AssignmentNode> tcs = assignmentNodes.values().iterator();
		try {
			while (tcs.hasNext()) {
				AssignmentNode tc = tcs.next();
				content += AssignmentNodeTemplate.create(account, tc)
						+ TempFields.UNIX_ENDLINE;
			}
		} catch (IOException e) {
			log.log(Level.WARNING, "", e);
			return false;
		}

		if(!writeFile(file, content)){
			return false;
		}
		content = null;
		return true;
	
	}
	// <--
	
	
	
	// Aman zhai. 2010.06.11
	public static boolean updateDynamicRouteNodes(
			Hashtable<String, DynamicRouteNode> dynamicRouteNodes, C5Account account){

		File file = newFile(account.getPbx(), account.getAccount(), DYNAMICROUTE);
		if(file == null){
			return false;
		}

		String content = "";
		Iterator<DynamicRouteNode> tcs = dynamicRouteNodes.values().iterator();
		try {
			while (tcs.hasNext()) {
				DynamicRouteNode tc = tcs.next();
				content += DynamicRouteNodeTemplate.create(account, tc)
						+ TempFields.UNIX_ENDLINE;
			}
		} catch (IOException e) {
			log.log(Level.WARNING, "", e);
			return false;
		}

		if(!writeFile(file, content)){
			return false;
		}
		content = null;
		return true;
	
	}
	// <--
		
	// Aman zhai. 2010.06.09
	public static boolean updateDialextenNodes(
			Hashtable<String, DialextenNode> dialextenNodes, C5Account account) {
		File file = newFile(account.getPbx(), account.getAccount(), DIALEXTEN);
		if(file == null){
			return false;
		}

		String content = "";
		Iterator<DialextenNode> tcs = dialextenNodes.values().iterator();
		while (tcs.hasNext()) {
			DialextenNode tc = tcs.next();
			content += DialextenNodeTemplate.create(account, tc) + TempFields.UNIX_ENDLINE;
		}

		if(!writeFile(file, content)){
			return false;
		}
		content = null;
		return true;
	}

	// <--

	public static boolean updateExtensionPeer(
			Hashtable<String, ExtensionPeer> ants, C5Account account) {
		File file = newFile(account.getPbx(), account.getAccount(), EXTENSION_PEER);
		if(file == null){
			return false;
		}

		String content = "";
		Iterator<ExtensionPeer> tcs = ants.values().iterator();
		while (tcs.hasNext()) {
			ExtensionPeer tc = tcs.next();
			content += ExtensionPeerTemplate.create(account, tc) + TempFields.UNIX_ENDLINE;
		}

		if(!writeFile(file, content)){
			return false;
		}
		content = null;
		return true;
	}

	public static boolean updateDialout(DialLine line, C5Account account) {
		File file = newFile(account.getPbx(), account.getAccount(), DIALOUT);
		if(file == null){
			return false;
		}

		String content = "";
		try {
			content = DialoutTemplate.create(account, line);
		} catch (IOException e1) {
			log.log(Level.WARNING, "", e1);
			return false;
		}

		if(!writeFile(file, content)){
			return false;
		}
		content = null;
		return true;
	}
	

	
	private static boolean writeFile(File file, String content){
		Writer out = null;
		try{
			if(file.canWrite()){
				out = new BufferedWriter(new OutputStreamWriter(
						new FileOutputStream(file), TempFields.CHARSET));
				out.write(content);
				out.flush();
			}else{
				throw new IOException("File is not writable.");
			}
		}catch(IOException e){
			log.log(Level.WARNING, "Write data into file failure.");
			return false;
		}finally{
			if(out != null){
				try {
					out.close();
				} catch (IOException e) {
					log.log(Level.WARNING, "file not close.");
				}
			}
		}
		return true;
	}
}
