package com.m7.cc.url;

import java.io.BufferedInputStream;
import java.io.BufferedOutputStream;
import java.io.BufferedReader;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.logging.Logger;

/**
 * 
 * @author Cai Zhibin
 *
 */
public class HttpProvider {
	private static Logger log = Logger.getLogger(HttpProvider.class.getName());
	
	public static String sendPost(String url, byte[] data) throws Exception{
		HttpURLConnection con = null;
		BufferedReader in = null;
		try {
			String result = "";
			URL httpUrl = new URL(url);
			con = (HttpURLConnection) httpUrl.openConnection();
			con.setRequestMethod("POST");
			con.setDoOutput(true);
			con.setConnectTimeout(10000);
			con.setReadTimeout(10000);
//			con.setRequestProperty("Content-Type", "application/xml;charset=utf-8"); 
			OutputStream out = con.getOutputStream();
			out.write(data);
			out.flush();
			out.close();
			int responseCode = con.getResponseCode();
			if (responseCode == HttpURLConnection.HTTP_OK) {
				in = new BufferedReader(new InputStreamReader(con
						.getInputStream()));
				String line;
				while ((line = in.readLine()) != null) {
					result += line;
				}
				return result;
			} else {

			}

		} catch (IOException e) {
			
			throw e;
		} finally {
			if (in != null) {
				try {
					if (in != null)
						in.close();
				} catch (IOException e) {
				}
			}
			
			if (con != null) {
				try{
					con.getInputStream().close();
				} catch (Throwable e){
					
				}
				try{
					con.getOutputStream().close();
				} catch (Throwable e){
					
				}
				con.disconnect();
			}
		}
		return null;
	}
	
	public static String sendGet(String url) throws Exception {
		String result = "";
		System.out.println("Call url: "+url);
		HttpURLConnection con = null;
		BufferedReader in = null;
		try {
			URL httpUrl = new URL(url);
			con = (HttpURLConnection) httpUrl.openConnection();
			con.setRequestMethod("GET");
			con.setReadTimeout(10000);
			int responseCode = con.getResponseCode();
			log.info("Get return ["+responseCode+"] from "+url);
			if (responseCode == HttpURLConnection.HTTP_OK) {
				in = new BufferedReader(new InputStreamReader(con
						.getInputStream()));
				String line;
				while ((line = in.readLine()) != null) {
					result += line;
				}
				return result;
			} else {
				
			}
		} catch (IOException e) {
			throw e;
		} finally {
			if(in != null)
				in.close();
			try{
				con.getInputStream().close();
			} catch (Throwable e){
				
			}
			try{
				con.getOutputStream().close();
			} catch (Throwable e){
				
			}
			con.disconnect();
		}
		return result;
	}
	
	public static String sendFile(String url, String filename) throws Exception{
		File file = new File(filename);
		if(!file.exists())
			throw new Exception("File ["+filename+"] not found");
		HttpURLConnection con = null;
		BufferedReader in = null;
		BufferedOutputStream out = null;
		InputStream fileIn = null;
		String result = null;
		try{
			
			URL httpUrl = new URL(url);
			con = (HttpURLConnection) httpUrl.openConnection();
			con.setRequestMethod("POST");
			con.setDoOutput(true);
			con.setReadTimeout(3600000);
			out = new BufferedOutputStream(con.getOutputStream());
			
			fileIn = new BufferedInputStream(new FileInputStream(file));
			byte[] data = new byte[1024];
			int count = -1;
			while((count = fileIn.read(data)) != -1){
				out.write(data, 0, count);
			}
			out.flush();
			out.close();
			fileIn.close();
			int responseCode = con.getResponseCode();
			if (responseCode == HttpURLConnection.HTTP_OK) {
				in = new BufferedReader(new InputStreamReader(con
						.getInputStream()));
				String line;
				result = "";
				while ((line = in.readLine()) != null) {
					result += line;
				}
				return result;
			} else {

			}
		} catch (Exception e){
			throw e;
		} finally {
			try{
				if(in != null)
					in.close();
			}catch (Exception e){}
			try{
				if(in != null)
					out.close();
			}catch (Exception e){}
			try{
				con.getInputStream().close();
			} catch (Throwable e){
				
			}
			try{
				con.getOutputStream().close();
			} catch (Throwable e){
				
			}
			con.disconnect();
			
		}
		
		return result;
	}
	
	public static void main(String[] args) {
//		String url = "http://127.0.0.1:3000/openService";
//		String data = "action=interfaceSms&account=N00000000143&password=123456&num=18600030392&sign=七陌科技&content=测试短信";
//		String url = "http://127.0.0.1:8888/GDSmsService";
//		String data = "args=2%2C18600030392%2C0%2CF671695150414161113%2C20150414161119%3B";
		try {
//			String url = "http://127.0.0.1:7000";
//			String url = "http://116.255.153.10:7788/statusApi.aspx";
//			String newData ="action=query&userid=88&account=qimuzy&password=123456";
//			String data = "action=login&data={\"userName\":\"abc\",\"password\":\"abc\",\"device\":\"ios\"}";
//			System.out.println(HttpProvider.sendPost(url, newData.getBytes("UTF-8")));
			
//			String url = "http://120.55.72.213:7780/app";
//			String data = "?Action=Dialout&ActionID=1234567890&Account=N00000000143&Exten=18600030392&FromExten=7000&PBX=1.1.1.101";
//			System.out.println(HttpProvider.sendPost(url, data.getBytes("UTF-8")));
			
//			String data = "{\"Command\":\"Action\",\"Action\":\"NewWebchat\",\"ActionID\":\"NewWebchat1234\",\"PBX\":\"1.1.1.101\","+
//							"\"Account\":\"N00000000143\",\"Sid\":\"sidsid\",\"MessageId\":\"123abc\",\"CreateTime\":\"123456\"," +
//							"\"MsgType\":\"newMsg\",\"AccessId\":\"79fa56a0-40d1-11e5-8bcb-f3d7d2578a5f\",\"Content\":\"hahahaha\"}";
//			System.out.println(HttpProvider.sendPost(url, data.getBytes("UTF-8")));			
			//jian zhou sms report test
//			String url = "http://115.29.10.194:8888/JZSmsService";
//			String data = "args=323456781%2C18717830363%2CDELIVRD%2C2013-12-12+12%3A12%3A12";
//			System.out.println(HttpProvider.sendPost(url, data.getBytes("UTF-8")));
			//yimi new sms report test
//			String url1 = "http://127.0.0.1:8888/YMNewSmsService?receiver=&pswd=&msgid=2021110150147099500&reportTime=1511101502&mobile=18600030392&status=DELIVRD";
//			System.out.println(HttpProvider.sendGet(url1));
			//ytx flow test
//			String url = "http://115.29.10.194:3000/ytxVoiceVerify";
////			
//			String data = "<?xml version=\"1.0\" encoding=\"UTF-8\"?><Request><appId>aaf98f8950e15fc10150ef88f9c32147</appId>"+
//			"<rechargeId>fe395ca79b86424fa9b48336351dd90c</rechargeId><phoneNum>18515056916</phoneNum>"+
//			"<status>3</status><msg>充值成功</msg><customId>cx</customId></Request>";
//			System.out.println(HttpProvider.sendPost(url, data.getBytes("UTF-8")));
			//
//			String url = "http://127.0.0.1:4000/qiniu/mps/notfiy";
//			String data = "{\"id\":\"z0.564894907823de48a830705e\",\"pipeline\":\"1380449361.IvrMusic\","+
//"\"code\":0,\"desc\":\"The fop was completed successfully\",\"reqid\":\"0SAAAMOIcPb75RYU\","+
//"\"inputBucket\":\"m7-ivr-music/\",\"inputKey\":\"c99a4a2ccfff827f1949667c00871819\",\"items\":[{"+
//"\"cmd\":\"avthumb/wav/ab/128k/ar/8000\",\"code\":0,\"desc\":\"The fop was completed successfully\",\"hash\":\"FiEzG-xtkqQoU6SU6L77c0yPGFoh\","+
//"\"key\":\"OOuPmA8_Tkoz3I8ZZudLM9orU1I=/FvvfFYDVMp_OTCqG7LnRjkQxGdFC\",\"returnOld\":0}]}";
//			System.out.println(HttpProvider.sendPost(url, data.getBytes("UTF-8")));	
//			
//			String[] arry = {"0c687da0-d6b4-11e5-837f-01659aadcbe1",
//					"0c8af9c0-d6b4-11e5-837f-01659aadcbe1",
//					"0cb4eff0-d6b4-11e5-837f-01659aadcbe1",
//					"0ce10900-d6b4-11e5-837f-01659aadcbe1",
//					"0d284b30-d6b4-11e5-837f-01659aadcbe1"};
//
//			String[] arry1 = {
//					"20117497",
//					"20117980",
//					"20117001",
//					"20119018",
//					"20151923",
//					"20117920",
//					"20117923",
//					"20118099",
//					"20117924",
//					"20119169",
//					"20117957",
//					"20117925",
//					"20159045",
//					"20161885",
//					"20162306",
//					"20198986",
//					"20201837",
//					"20202053",
//					"20118562",
//					"20119647",
//					"20120812",
//					"20119649",
//					"20117972",
//					"20119821",
//					"20117786",
//					"20120517",
//					"20117820",
//					"20119222",
//					"20126844",
//					"20126900",
//					"20128495",
//					"20128498",
//					"20128510",
//					"20128509",
//					"20139528",
//					"20139472",
//					"20139470",
//					"20145570",
//					"20139469",
//					"20165512",
//					"20165997",
//					"20178589",
//					"20179038",
//					"20179522",
//					"20178790",
//					"20191673",
//					"20192407",
//					"20144588",
//					"20116808",
//					"20155855",
//					"20167801"
//			};
//			String url1 = "http://121.40.114.14:7789";
//			for(int i=0 ;i<arry1.length;i++){
//				System.out.println(i+" deal");
////				String data2 = "{\"User\":\""+arry[i]+"\",\"Account\":\"N00000002595\",\"PBX\":\"bj.ali.4.9\",\"Action\":\"UserRemove\",\"Command\":\"Action\",\"ActionID\":\"UserRemove0.731477020541206\"}\r\n";
//				String data2 = "{\"Exten\":\""+arry1[i]+"\", \"Peer\":\"ACSSipPeer\",\"Account\":\"N00000002595\",\"PBX\":\"bj.ali.4.9\",\"Action\":\"PeerRemove\",\"Command\":\"Action\",\"ActionID\":\"PeerRemove0.731477020541206\"}\r\n";
//				System.out.println(HttpProvider.sendPost(url1, data2.getBytes("UTF-8")));
//				Thread.sleep(100);
//			}
			

//			String url1 = "http://120.27.131.222:7789";
//			String data2 = "{\"Account\":\"N00000011024\",\"PBX\":\"sh.ali.7.2\",\"Action\":\"AccountRemove\",\"Command\":\"Action\",\"ActionID\":\"AccountRemove0.731477020541206\"}\r\n";
//			String data2 = "{\"Exten\":\"10008451\",\"Account\":\"N00000006366\",\"PBX\":\"sh.ali.5.2\",\"Action\":\"PeerRemove\",\"Peer\":\"ACSQueue\",\"Command\":\"Action\",\"ActionID\":\"PeerRemove0.2560591937508434\"}\r\n";
//			String data2 = "{\"Dialout\":false,\"Exten\":\"901\",\"Account\":\"N00000000143\",\"PBX\":\"1.1.1.100\",\"Action\":\"DialLineAdd\",\"UpdateTime\":\"2016-02-26\",\"Command\":\"Action\",\"ActionID\":\"DialLineAdd0.7258802901487797\"}\r\n";
//			String data2 = "{\"app_id\": \"wx894f14bd8ab3d594\",\"nick_name\":\"仰望星空\",\"content\":\"bbbbb\",\"msgType\":\"text\",\"open_id\":\"oeogss-MmJfirxVsOBU5J94ccfVs\",\"timestamp\":\"1459416576\",\"nonce\":\"1630445863\",\"msg_signature\":\"15d4aa3cd2138b05d6ded7497a9776439053eeb0\"}";
//			String data2 = "{\"Account\":\"N00000005635\",\"PBX\":\"btg.ali.1.0\",\"User\":\"054ae4b1-ecdd-11e5-9edb-9965fd1a5121\",\"Action\":\"UserRemove\",\"Command\":\"Action\",\"ActionID\":\"UserRemove0.731477020541206\"}\r\n";
//			String data2 = "{\"num_a\":\"123456\",\"num_b\":\"456789\",\"city_id\":\"010\"}";
//			String url1 = "http://api.7moor.com/didi/phone/bindByNum";
//			String data2 = "{\"num_a\":\"18600030392\",\"num_b\":\"17051100392\",\"trunk_num\":\"01057990545\"}";
//			String url1 = "http://api.7moor.com/didi/phone/unbind";
//			String data2 = "{\"bind_id\":\"ac47d5f0-11c4-11e6-acc4-ff1bea35537a\"}";
			
//			System.out.println(HttpProvider.sendGet("http://121.40.250.6:4000/didi/phone/didiPbxGetBind/18600030392/01057990545"));
			
//			String url1 = "http://api.7moor.com/didi/phone/bind";
//			String data2 = "{\"num_a\":\"18600030392\",\"num_b\":\"17051100392\",\"city_id\":\"010\"}";
//			String url1 = "http://112.124.23.131:3000/service";
//			String data2 = "action=assGetQiNiuHandPushAccounts&data={\"pbx\":\"gz.ali.3\"}&md5=81f0e1f0-32df-11e3-a2e6-1d21429e5f46";
			
//			String url1 = "http://121.43.153.58:7789";
//			String data2 = "{\"Account\":\"N00000006021\",\"PBX\":\"sz.rx.01.0\",\"Exten\":\"10011819\",\"Action\":\"PeerRemove\",\"Peer\":\"ACSQueue\",\"Command\":\"Action\",\"ActionID\":\"PeerRemove0.731477020541206\"}\r\n";
//			System.out.println(HttpProvider.sendPost(url1, data2.getBytes("UTF-8")));
			
//			String data = "{\"Event\":\"EventDispatcherResend\",\"Command\":\"Event\",\"PBX\":\"sh.sjhl.1.1\",\"url\":\"http://admin.dadaabc.com:10010/callapi/moor_outboard?CallNo=02126122599&CallSheetID=866a57b0-f4fc-4a6a-96c3-f3acd6f3f777&CalledNo=15052719866&CallID=cc-ali-0-1471070577.1355648&CallType=dialout&RecordFile=monitor%2Fsh.sjhl.1.1%2F20160813%2F20160813-144301_N00000003757__915052719866_cc-ali-0-1471070577.1355648.mp3&Ring=2016-08-13+14%3A42%3A58&Begin=2016-08-13+14%3A43%3A17&End=2016-08-13+14%3A47%3A26&QueueTime=&Queue=&Agent=8101&Exten=8101&AgentName=%E8%B5%B5%E8%8B%B1%E6%9D%B0+8101&ActionID=173842459&CallState=Unlink&State=dealing&FileServer=http%3A%2F%2F61.152.242.50&MonitorFilename=http%3A%2F%2F61.152.242.50%2Fmonitor%2Fsh.sjhl.1.1%2F20160813%2F20160813-144301_N00000003757__915052719866_cc-ali-0-1471070577.1355648.mp3&CallStatus=dealing&RealState=Ringing&Province=%E6%B1%9F%E8%8B%8F%E7%9C%81&District=%E5%AE%BF%E8%BF%81%E5%B8%82&RingingTimestamp=1471070587.877956\"}";
//			System.out.println(HttpProvider.sendPost("http://112.124.65.214:8082/"+"cdr", 
//					data.getBytes("UTF-8")));
			
		} catch (Exception e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
	}
}
