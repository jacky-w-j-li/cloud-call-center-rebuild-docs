package com.dishui.util;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.lang.Character.UnicodeBlock;
import java.net.HttpURLConnection;
import java.net.URL;
import java.security.MessageDigest;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Date;

import org.json.JSONArray;
import org.json.JSONObject;

/**
 * 爱慕内衣 提供的http类,从他们的服务端取数据
 * HTTP 客户端工具类
 */

public class AiMuNeiYiHttpClientUtil {

	// POST请求模式

	public final static String HTTP_METHOD = "POST";

	// 请求格式参数

	public final static String CONTENT_TYPE = "Content-Type";

	// 请求格式

	public final static String APP_XML = "application/xml";

	public final static String APP_OCT_STREAM = "application/x-www-form-urlencoded";

	// 连接超时

	public final static int CONNECT_TIME_OUT = 3600000;

	// 返回超时

	public final static int READ_TIME_OUT = 3600000;

	private static final char[] HEX_DIGITS = { '0', '1', '2', '3', '4', '5',
			'6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f' };

	private static String passkey = "IJH*HR_$^*G7(9TU&55!@";
	private static String hosturl = "http://www.aimer.com.cn/offline/";
	
	/**
	 * 
	 * HTTP客户端POST请求方法
	 * 
	 * @param host
	 *            访问的地址
	 * 
	 * @param postData
	 *            数据
	 * 
	 * @return 服务器返回的结果数据
	 * 
	 * @throws Exception
	 *             请求的异常信息
	 */

	public static String post(String host, String postData) throws Exception {

		// Logs.debug("准备连接服务:" + host);

		// Logs.debug("发送数据:" + postData);

		//ogs.info(postData);

		URL url = null;

		HttpURLConnection connection = null;

		OutputStreamWriter out = null;

		InputStream urlInStream = null;

		BufferedReader reader = null;

		StringBuilder totalString = new StringBuilder();

		try {

			// 创建连接对象

			url = new URL(host);
//			Logs.debug(hosturl+host);
//			Logs.debug(postData);
			// 建立连接

			connection = (HttpURLConnection) url.openConnection();

			// Logs.debug("已经建立连接.");

			// 把连接设为输出模式。URLConnection通常作为输入来使用

			connection.setDoOutput(true);

			// 把连接设为输入模式

			connection.setDoInput(true);

			// POST请求模式

			connection.setRequestMethod(HTTP_METHOD);

			// 设置本次发送请求的数据格式为 application_xml

			connection.setRequestProperty(CONTENT_TYPE, APP_OCT_STREAM);
			final String udid = "10000";
			connection.addRequestProperty("udid", udid);
			SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
			final String tp = sdf.format(new Date());
			connection.addRequestProperty("timestamp", tp);
			//Logs.info("**************************"+tp);
			String[] s = {udid,tp};
			int pos = postData.indexOf("=");
			String n = postData.substring(0,pos);
			String v = postData.substring(pos+1);
			//Logs.info(v);
			connection.addRequestProperty("sign", getSign(s,passkey,n+"="+v));
			//connection.setRequestProperty("User-Agent", "Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10.4; en-US; rv:1.9.2.2) Gecko/20100316 Firefox/3.6.2");

			// 设置连接超时时限
			//Logs.debug("udid:"+udid+" tp:"+tp+" sign:"+getSign(s,passkey,postData)+" postData:"+postData);
			connection.setConnectTimeout(CONNECT_TIME_OUT);

			// 设置返回超时时限

			connection.setReadTimeout(READ_TIME_OUT);

		
			// Logs.debug("数据发送完毕.");


			// 建立数据发送通道
			out = new OutputStreamWriter(connection.getOutputStream(), "utf-8");
			// 发送数据
			//Logs.info(n+"="+v);
			//out.write(n+"="+URLEncoder.encode(v,"UTF-8"));
			out.write(postData);
			// 清空通道
			out.flush();
			 //Logs.debug("数据发送完毕.");
			// 读取服务器返回结果
			String currentLine = null;
			// 建立数据读取通道
			urlInStream = connection.getInputStream();

			// 包装通道

			reader = new BufferedReader(new InputStreamReader(urlInStream,
					"utf-8"));

			// int lineNum = 1;

			while ((currentLine = (reader.readLine())) != null) {

				// if (lineNum > 1)
				//
				// totalString.append("\n");
				totalString.append(currentLine);
				// lineNum ++;
			}
			
			// Logs.debug("数据接收完毕.");

			//Logs.info(totalString.toString());

		} catch (Exception e) {
			e.printStackTrace();
//			Logs.error(e.getMessage());
			throw new Exception(e);

		} finally {

			// 释放连接资源

			if (connection != null) {

				connection.disconnect();

			}

			if (out != null) {

				out.close();

			}

			if (urlInStream != null) {

				urlInStream.close();

			}

			if (reader != null) {

				reader.close();

			}

		}

		// 返回请求结果数据

		return totalString.toString();

	}

	public static void main(String[] args) {
		// HttpClientUtil hcu = new HttpClientUtil();
		try {
			// String s =
			// HttpClientUtil.post("http://192.168.108.100:8080/vom/rs/SendMatrixes/reviceMatrixes",
			// "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?><Message><MessageHead><ServiceName>SendProperties</ServiceName><RequestTime>2013-4-11 12:00:00</RequestTime><MessageType>request</MessageType><ReqNo>19800104</ReqNo></MessageHead><MessageBody><itemList><item><matrixId>100002011</matrixId> <matrixDescription>网格描述11</matrixDescription><standardCode>116029</standardCode> <changeMode>I</changeMode> </item><item><matrixId>100002012</matrixId> <matrixDescription>网格描述12</matrixDescription><standardCode>116029</standardCode> <changeMode>I</changeMode></item></itemList></MessageBody></Message>");

			// 1.1
			// String s =
			// HttpClientUtil.post("http://localhost:8080/HR/SendProperties.xml",
			// "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?><Message><MessageHead><ServiceName>SendProperties</ServiceName><RequestTime>2013-4-11 12:00:00</RequestTime><MessageType>request</MessageType><ReqNo>19800104</ReqNo></MessageHead><MessageBody><itemList><item><valueSetId>unitId</valueSetId><description>计量单位id</description><value>1</value><valueMeaning>KG</valueMeaning><parentValueSetId></parentValueSetId><parentValueLow></parentValueLow><changeMode>I</changeMode></item><item><valueSetId>unitId</valueSetId><description>计量单位id</description><value>2</value><valueMeaning>G</valueMeaning><parentValueSetId></parentValueSetId><parentValueLow></parentValueLow><changeMode>I</changeMode></item></itemList></MessageBody></Message>");
			// System.out.println("SendProperties:"+s);

			// 1.2
			// String s =
			// HttpClientUtil.post("http://localhost:8080/HR/SendItems.xml",
			// "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?><Message><MessageHead><ServiceName>SendItems</ServiceName><RequestTime>2013-4-11 12:00:00</RequestTime><MessageType>request</MessageType><ReqNo>19800104</ReqNo></MessageHead><MessageBody><itemList><item><id>1</id><code>aa</code><name>冰箱</name><length>100</length><width>30</width><height>50</height><unitId>1</unitId><brandId>1</brandId><prdGrpId>1</prdGrpId><prdSeriesId>1</prdSeriesId><activeFlag>1</activeFlag><volume>1</volume><volumeUomCode>1</volumeUomCode><grossWeightNumber>1</grossWeightNumber><weightUnit>1</weightUnit><changeMode>I</changeMode></item><item><id>2</id><code>bb</code><name>冰箱</name><length>100</length><width>30</width><height>50</height><unitId>1</unitId><brandId>1</brandId><prdGrpId>1</prdGrpId><prdSeriesId>1</prdSeriesId><activeFlag>1</activeFlag><volume>1</volume><volumeUomCode>1</volumeUomCode><grossWeightNumber>1</grossWeightNumber><weightUnit>1</weightUnit><changeMode>I</changeMode></item></itemList></MessageBody></Message>");
			// System.out.println("SendItems:"+s);

			// 1.5
			// String s =
			// HttpClientUtil.post("http://localhost:8080/HR/SendItemPrice.xml",
			// "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?><Message><MessageHead><ServiceName>SendItemPrice</ServiceName><RequestTime>2013-4-11 12:00:00</RequestTime><MessageType>request</MessageType><ReqNo>19800104</ReqNo></MessageHead><MessageBody><platId>taobao</platId><itemList><item><id>1</id><itemNo>1</itemNo><startTime>2013-06-01</startTime><endTime>2013-06-02</endTime><promotionID>1</promotionID><comments>aa</comments><lowerPrice>2.00</lowerPrice><upperPrice>20.00</upperPrice><changeMode>I</changeMode></item><item><id>1</id><itemNo>1</itemNo><startTime>2013-06-01</startTime><endTime>2013-06-02</endTime><promotionID>1</promotionID><comments>aa</comments><lowerPrice>12.00</lowerPrice><upperPrice>20.00</upperPrice><changeMode>I</changeMode></item></itemList></MessageBody></Message>");
			// System.out.println("SendItemPrice:"+s);

			// 1.6
			// String s =
			// HttpClientUtil.post("http://localhost:8080/HR/SendMetrixes.xml",
			// "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?><Message><MessageHead><ServiceName>SendMetrixes</ServiceName><RequestTime>2013-4-11 12:00:00</RequestTime><MessageType>request</MessageType><ReqNo>19800104</ReqNo></MessageHead><MessageBody><itemList><item><matrixId>100002011</matrixId> <matrixDescription>网格描述11</matrixDescription><standardCode>116029</standardCode> <changeMode>I</changeMode> </item><item><matrixId>100002012</matrixId> <matrixDescription>网格描述12</matrixDescription><standardCode>116029</standardCode> <changeMode>I</changeMode></item></itemList></MessageBody></Message>");
			// System.out.println("SendMetrixes:"+s);

			// 2.1
			// String s =
			// HttpClientUtil.post("http://10.135.12.176/HR/SendItemPrice.xml",
			// "<?xml version=\"1.0\" encoding=\"UTF-8\"?><Message><MessageHead><ServiceName>SendItemPrice</ServiceName><RequestTime>2013-08-06 16:00:49</RequestTime><ReqNo>c21a8ee0-a5d0-4ec2-b306-baddaffe09ff</ReqNo></MessageHead><MessageBody><platId>1</platId><itemList><item><id>3826850</id><salePlatId>1</salePlatId><itemNo>CB00XEB0E</itemNo><startTime>2013-07-01 00:00:00</startTime><endTime>2014-07-01 00:00:00</endTime><promotionId>0</promotionId><comments> </comments><lowerPrice>1899</lowerPrice><upperPrice>1899</upperPrice><changeMode>I</changeMode></item><item><id>3825185</id><salePlatId>1</salePlatId><itemNo>CB00XFB0E</itemNo><startTime>2013-07-01 00:00:00</startTime><endTime>2014-07-01 00:00:00</endTime><promotionId>0</promotionId><comments> </comments><lowerPrice>2799</lowerPrice><upperPrice>2799</upperPrice><changeMode>I</changeMode></item><item><id>479384</id><salePlatId>1</salePlatId><itemNo>CB0B3401A</itemNo><startTime>2013-07-01 00:00:00</startTime><endTime>2014-07-01 00:00:00</endTime><promotionId>0</promotionId><comments> </comments><lowerPrice>1880</lowerPrice><upperPrice>1880</upperPrice><changeMode>I</changeMode></item><item><id>3826853</id><salePlatId>1</salePlatId><itemNo>CB0GD0B16</itemNo><startTime>2013-07-01 00:00:00</startTime><endTime>2014-07-01 00:00:00</endTime><promotionId>0</promotionId><comments> </comments><lowerPrice>1999</lowerPrice><upperPrice>1999</upperPrice><changeMode>I</changeMode></item><item><id>3826849</id><salePlatId>1</salePlatId><itemNo>CB0GD1B0H</itemNo><startTime>2013-07-01 00:00:00</startTime><endTime>2014-07-01 00:00:00</endTime><promotionId>0</promotionId><comments> </comments><lowerPrice>2199</lowerPrice><upperPrice>2199</upperPrice><changeMode>I</changeMode></item><item><id>500277</id><salePlatId>1</salePlatId><itemNo>CB0GDBB0E</itemNo><startTime>2013-07-01 00:00:00</startTime><endTime>2014-07-01 00:00:00</endTime><promotionId>0</promotionId><comments> </comments><lowerPrice>2259</lowerPrice><upperPrice>2259</upperPrice><changeMode>I</changeMode></item><item><id>351154</id><salePlatId>1</salePlatId><itemNo>CB0GF000M</itemNo><startTime>2013-07-01 00:00:00</startTime><endTime>2014-07-01 00:00:00</endTime><promotionId>0</promotionId><comments> </comments><lowerPrice>2680</lowerPrice><upperPrice>2680</upperPrice><changeMode>I</changeMode></item><item><id>516972</id><salePlatId>1</salePlatId><itemNo>CB0JR0000</itemNo><startTime>2013-07-01 00:00:00</startTime><endTime>2014-07-01 00:00:00</endTime><promotionId>0</promotionId><comments> </comments><lowerPrice>1339</lowerPrice><upperPrice>1339</upperPrice><changeMode>I</changeMode></item><item><id>347099</id><salePlatId>1</salePlatId><itemNo>CB0JZ001A</itemNo><startTime>2013-07-01 00:00:00</startTime><endTime>2014-07-01 00:00:00</endTime><promotionId>0</promotionId><comments> </comments><lowerPrice>1580</lowerPrice><upperPrice>1580</upperPrice><changeMode>I</changeMode></item><item><id>3829285</id><salePlatId>1</salePlatId><itemNo>CB0K46000</itemNo><startTime>2013-07-01 00:00:00</startTime><endTime>2014-07-01 00:00:00</endTime><promotionId>0</promotionId><comments> </comments><lowerPrice>1799</lowerPrice><upperPrice>1799</upperPrice><changeMode>I</changeMode></item><item><id>3879711</id><salePlatId>1</salePlatId><itemNo>CB0K51000</itemNo><startTime>2013-07-01 00:00:00</startTime><endTime>2014-07-01 00:00:00</endTime><promotionId>0</promotionId><comments> </comments><lowerPrice>2399</lowerPrice><upperPrice>2399</upperPrice><changeMode>I</changeMode></item><item><id>3826855</id><salePlatId>1</salePlatId><itemNo>CB0K84B0E</itemNo><startTime>2013-07-01 00:00:00</startTime><endTime>2014-07-01 00:00:00</endTime><promotionId>0</promotionId><comments> </comments><lowerPrice>2099</lowerPrice><upperPrice>2099</upperPrice><changeMode>I</changeMode></item><item><id>3829279</id><salePlatId>1</salePlatId><itemNo>CB0KP5000</itemNo><startTime>2013-07-01 00:00:00</startTime><endTime>2014-07-01 00:00:00</endTime><promotionId>0</promotionId><comments> </comments><lowerPrice>1659</lowerPrice><upperPrice>1659</upperPrice><changeMode>I</changeMode></item><item><id>3829280</id><salePlatId>1</salePlatId><itemNo>CB0KZ6000</itemNo><startTime>2013-07-01 00:00:00</startTime><endTime>2014-07-01 00:00:00</endTime><promotionId>0</promotionId><comments> </comments><lowerPrice>2099</lowerPrice><upperPrice>2099</upperPrice><changeMode>I</changeMode></item><item><id>458251</id><salePlatId>1</salePlatId><itemNo>CB0M64000</itemNo><startTime>2013-07-01 00:00:00</startTime><endTime>2014-07-01 00:00:00</endTime><promotionId>0</promotionId><comments> </comments><lowerPrice>2359</lowerPrice><upperPrice>2359</upperPrice><changeMode>I</changeMode></item><item><id>3829284</id><salePlatId>1</salePlatId><itemNo>CB0MJ0016</itemNo><startTime>2013-07-01 00:00:00</startTime><endTime>2014-07-01 00:00:00</endTime><promotionId>0</promotionId><comments> </comments><lowerPrice>1999</lowerPrice><upperPrice>1999</upperPrice><changeMode>I</changeMode></item><item><id>3826856</id><salePlatId>1</salePlatId><itemNo>CB0ML0B0E</itemNo><startTime>2013-07-01 00:00:00</startTime><endTime>2014-07-01 00:00:00</endTime><promotionId>0</promotionId><comments> </comments><lowerPrice>1699</lowerPrice><upperPrice>1699</upperPrice><changeMode>I</changeMode></item><item><id>6236206</id><salePlatId>1</salePlatId><itemNo>CB0MM000G</itemNo><startTime>2013-07-01 00:00:00</startTime><endTime>2014-07-01 00:00:00</endTime><promotionId>0</promotionId><comments> </comments><lowerPrice>2599</lowerPrice><upperPrice>2599</upperPrice><changeMode>I</changeMode></item><item><id>3826857</id><salePlatId>1</salePlatId><itemNo>CB0MM0B0M</itemNo><startTime>2013-07-01 00:00:00</startTime><endTime>2014-07-01 00:00:00</endTime><promotionId>0</promotionId><comments> </comments><lowerPrice>1559</lowerPrice><upperPrice>1559</upperPrice><changeMode>I</changeMode></item><item><id>3219353</id><salePlatId>1</salePlatId><itemNo>CB0N10000</itemNo><startTime>2013-07-01 00:00:00</startTime><endTime>2014-07-01 00:00:00</endTime><promotionId>0</promotionId><comments> </comments><lowerPrice>2999</lowerPrice><upperPrice>2999</upperPrice><changeMode>I</changeMode></item><item><id>3879709</id><salePlatId>1</salePlatId><itemNo>CB0N61000</itemNo><startTime>2013-07-01 00:00:00</startTime><endTime>2014-07-01 00:00:00</endTime><promotionId>0</promotionId><comments> </comments><lowerPrice>2499</lowerPrice><upperPrice>2499</upperPrice><changeMode>I</changeMode></item><item><id>3829277</id><salePlatId>1</salePlatId><itemNo>CBAC21016</itemNo><startTime>2013-07-01 00:00:00</startTime><endTime>2014-07-01 00:00:00</endTime><promotionId>0</promotionId><comments> </comments><lowerPrice>1859</lowerPrice><upperPrice>1859</upperPrice><changeMode>I</changeMode></item><item><id>5806803</id><salePlatId>1</salePlatId><itemNo>CBAC22016</itemNo><startTime>2013-07-01 00:00:00</startTime><endTime>2014-07-01 00:00:00</endTime><promotionId>0</promotionId><comments> </comments><lowerPrice>2699</lowerPrice><upperPrice>2699</upperPrice><changeMode>I</changeMode></item><item><id>516660</id><salePlatId>1</salePlatId><itemNo>CBAC9100M</itemNo><startTime>2013-07-01 00:00:00</startTime><endTime>2014-07-01 00:00:00</endTime><promotionId>0</promotionId><comments> </comments><lowerPrice>2199</lowerPrice><upperPrice>2199</upperPrice><changeMode>I</changeMode></item><item><id>516007</id><salePlatId>1</salePlatId><itemNo>CBAC9200M</itemNo><startTime>2013-07-01 00:00:00</startTime><endTime>2014-07-01 00:00:00</endTime><promotionId>0</promotionId><comments> </comments><lowerPrice>2199</lowerPrice><upperPrice>2199</upperPrice><changeMode>I</changeMode></item><item><id>493332</id><salePlatId>1</salePlatId><itemNo>CBAC9300M</itemNo><startTime>2013-07-01 00:00:00</startTime><endTime>2014-07-01 00:00:00</endTime><promotionId>0</promotionId><comments> </comments><lowerPrice>2499</lowerPrice><upperPrice>2499</upperPrice><changeMode>I</changeMode></item><item><id>508081</id><salePlatId>1</salePlatId><itemNo>CBACF0016</itemNo><startTime>2013-07-01 00:00:00</startTime><endTime>2014-07-01 00:00:00</endTime><promotionId>0</promotionId><comments> </comments><lowerPrice>2199</lowerPrice><upperPrice>2199</upperPrice><changeMode>I</changeMode></item><item><id>508084</id><salePlatId>1</salePlatId><itemNo>CBACF4016</itemNo><startTime>2013-07-01 00:00:00</startTime><endTime>2014-07-01 00:00:00</endTime><promotionId>0</promotionId><comments> </comments><lowerPrice>2499</lowerPrice><upperPrice>2499</upperPrice><changeMode>I</changeMode></item><item><id>9468255</id><salePlatId>1</salePlatId><itemNo>CBAG8000E</itemNo><startTime>2013-07-01 00:00:00</startTime><endTime>2014-07-01 00:00:00</endTime><promotionId>0</promotionId><comments> </comments><lowerPrice>2899</lowerPrice><upperPrice>2899</upperPrice><changeMode>I</changeMode></item><item><id>8691897</id><salePlatId>1</salePlatId><itemNo>CBAGP0000</itemNo><startTime>2013-07-01 00:00:00</startTime><endTime>2014-07-01 00:00:00</endTime><promotionId>0</promotionId><comments> </comments><lowerPrice>2399</lowerPrice><upperPrice>2399</upperPrice><changeMode>I</changeMode></item><item><id>9468256</id><salePlatId>1</salePlatId><itemNo>CBAGU000E</itemNo><startTime>2013-07-01 00:00:00</startTime><endTime>2014-07-01 00:00:00</endTime><promotionId>0</promotionId><comments> </comments><lowerPrice>2299</lowerPrice><upperPrice>2299</upperPrice><changeMode>I</changeMode></item><item><id>9468257</id><salePlatId>1</salePlatId><itemNo>CBAGU200E</itemNo><startTime>2013-07-01 00:00:00</startTime><endTime>2014-07-01 00:00:00</endTime><promotionId>0</promotionId><comments> </comments><lowerPrice>2899</lowerPrice><upperPrice>2899</upperPrice><changeMode>I</changeMode></item><item><id>588</id><salePlatId>1</salePlatId><itemNo>AA0UN0000</itemNo><startTime>2013-08-07 00:00:00</startTime><endTime>2013-08-31 00:00:00</endTime><promotionId> </promotionId><comments> </comments><lowerPrice>100</lowerPrice><upperPrice>2000</upperPrice><changeMode>I</changeMode></item></itemList></MessageBody></Message>");
			// System.out.println("SendStock:"+s);

			// 3.2
			// String s =
			// HttpClientUtil.post("http://localhost:8080/HR/SetOrderStatusFailure.xml",
			// "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?><Message><MessageHead><ServiceName>SetOrderStatusFailure</ServiceName><RequestTime>2013-4-11 12:00:00</RequestTime><MessageType>request</MessageType><ReqNo>19800104</ReqNo></MessageHead><MessageBody><platId>taobao</platId><id>11</id><itemList><item><matrixId>1000201</matrixId><stock>100</stock></item><item><matrixId>1000202</matrixId><stock>200</stock></item></itemList></MessageBody></Message>");
			// System.out.println("SetOrderStatusFailure:"+s);

			// 3.4 订单清帐
			// String s =
			// HttpClientUtil.post("http://localhost:8080/HR/OrdersSettle.xml",
			// "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?><Message><MessageHead><ServiceName>OrdersSettle</ServiceName><RequestTime>2013-4-11 12:00:00</RequestTime><MessageType>request</MessageType><ReqNo>19800104</ReqNo></MessageHead><MessageBody><platId>taobao</platId><id>11</id><itemList><item><matrixId>1000201</matrixId><stock>100</stock></item><item><matrixId>1000202</matrixId><stock>200</stock></item></itemList></MessageBody></Message>");
			// System.out.println("SendStock:"+s);

			// 3.5
			// String s =
			// HttpClientUtil.post("http://localhost:8080/HR/SetOrderTransInfo.xml",
			// "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?><Message><MessageHead><ServiceName>SetOrderTransInfo</ServiceName><RequestTime>2013-4-11 12:00:00</RequestTime><MessageType>request</MessageType><ReqNo>19800104</ReqNo></MessageHead><MessageBody><itemList><item><orderNo>1</orderNo><subOrderNo>1</subOrderNo><deliveryDate>2013-01-01 01:01:01</deliveryDate><deliveryStart>测试</deliveryStart><deliveryEnd>endaddress</deliveryEnd><user>test</user><mobile>13911268014</mobile><Phone>asdfadfasdfa</Phone><status>1</status><memo>阿萨德发觉上当了发掘第三方</memo></item><item><orderNo>2</orderNo><subOrderNo>1</subOrderNo><deliveryDate>2013-01-02 01:01:01</deliveryDate><deliveryStart>测试中文startaddress11111</deliveryStart><deliveryEnd>测试中文endaddress2222</deliveryEnd><user>test2222</user><mobile>13911268014</mobile><Phone>asdfadfasdfa</Phone><status>1</status><memo>阿萨德发觉上当了发掘第三方</memo></item></itemList></MessageBody></Message>");
			// System.out.println("SetOrderTransInfo:"+s);
			/*
			String str = "skus={\"skus\":\"IM16GH1D90160:2,AM44D66D165:0\"}";
			String stt = HttpClientUtil.post("updateproductstock", str);*/
			
			/*
			String str = "po_details={\"po_id\":\"PH1412025196\",\"details\":[{\"sku\":\"NS23D21700170\",\"num\":\"20\"},{\"sku\":\"NS23D21700175\",\"num\":\"3\"}]}";
			String stt = HttpClientUtil.post("purchaseorder_outgoingdetails", str);
			*/
			/*
			 String str = "po_details=[{\"sku\":\"AM12E51P4AC85\",\"num\":\"1\"},{\"sku\":\"AM73C75400155\",\"num\":\"3\"}]";
			 String stt =  HttpClientUtil.post("purchaseorder_outgoingdetails", str);
			 */
			
			
			//String str = "product={\"sku\":\"AM753456160\",\"v6_special_flag\":\"1\",\"v6_class\":\"E\u4fdd\u6696&\u6253\u5e95\",\"v6_brand\":\"AM\",\"v6_season\":\"\u79cb\u51ac\",\"v6_years\":\"2003\",\"v6_grade\":\"\u62a5\u5e9f\",\"v6_price\":\"0\",\"v6_specialprice_starttime\":\"2012-07-17 00:00:00\",\"v6_specialprice_endtime\":\"2049-12-31\",\"v6_bn\":\"AM7534\",\"v6_color_code\":\"AM7534\",\"v6_color_name\":\"56\",\"v6_size_code\":\"56\u8272\",\"v6_name\":\"160\",\"v6_series\":\"03\u8272\u62c9\u59c6\u62a4\u819d\u62a4\u8170\u88e4\",\"barcode\":\"753456-030160\"}";
			//String str = "product={\"sku\":\"AM753340160\",\"v6_special_flag\":\"1\",\"v6_class\":\"E\u4fdd\u6696\u0026\u6253\u5e95\",\"v6_brand\":\"AM\",\"v6_season\":\"\u79cb\u51ac\",\"v6_years\":\"2003\",\"v6_grade\":\"\u62a5\u5e9f\",\"v6_price\":\"235\",\"v6_specialprice_starttime\":\"2012-07-17 00:00:00\",\"v6_specialprice_endtime\":\"2049-12-31\",\"v6_bn\":\"AM7533\",\"v6_color_code\":\"40\",\"v6_color_name\":\"40\u8272\",\"v6_size_code\":\"160\",\"v6_name\":\"03\u8272\u62c9\u59c6\u4f4e\u8170\u88e4\",\"v6_series\":\"03\u8272\u62c9\u59c6\",\"barcode\":\"753340-030160\"}";
			//String str = "product={\"sku\":\"AM753340160\",\"v6_special_flag\":\"1\",\"v6_class\":\""+utf8ToUnicode("E保暖&打底")+"\",\"v6_brand\":\"AM\",\"v6_season\":\""+utf8ToUnicode("秋冬")+"\",\"v6_years\":\"2003\",\"v6_grade\":\""+utf8ToUnicode("报废")+"\",\"v6_price\":\"235\",\"v6_specialprice_starttime\":\"2012-07-17 00:00:00\",\"v6_specialprice_endtime\":\"2049-12-31\",\"v6_bn\":\"AM7533\",\"v6_color_code\":\"40\",\"v6_color_name\":\""+utf8ToUnicode("40色")+"\",\"v6_size_code\":\"160\",\"v6_name\":\""+utf8ToUnicode("03色拉姆低腰裤")+"\",\"v6_series\":\""+utf8ToUnicode("03色拉姆")+"\",\"barcode\":\"753340-030160\"}";
			//String str = "product={\"sku\":\"AM753456160\",\"v6_special_flag\":\"1\",\"v6_class\":\"E\u4fdd\u6696&\u6253\u5e95\",\"v6_brand\":\"AM\",\"v6_season\":\"\u79cb\u51ac\",\"v6_years\":\"2003\",\"v6_grade\":\"\u62a5\u5e9f\",\"v6_price\":\"0\",\"v6_specialprice_starttime\":\"2012-07-17 00:00:00\",\"v6_specialprice_endtime\":\"2049-12-31\",\"v6_bn\":\"AM7534\",\"v6_color_code\":\"AM7534\",\"v6_color_name\":\"56\",\"v6_size_code\":\"56\u8272\",\"v6_name\":\"160\",\"v6_series\":\"03\u8272\u62c9\u59c6\u62a4\u819d\u62a4\u8170\u88e4\",\"barcode\":\"753456-030160\"}";
//			String str="po_details={po_details:[{\"sku\":\"AM12E51P4AC85\",\"num\":\"1\"},{\"sku\":\"AM73C75400155\",\"num\":\"3\"}]}";
//			String stt = HttpClientUtil.post("purchaseorder", str);
//            HttpClientUtil hc = new HttpClientUtil();
			String stt = AiMuNeiYiHttpClientUtil.post("http://124.207.152.79:8080/aimer/userinfo", "mobile={mobile:'13901002953'}");
			System.out.println(stt);
		} catch (Exception e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
	}

	public static String getSign(String[] hds, String passkey, String postdata)
			throws Exception {
		String sign = "";
		try {
			if (hds == null || hds.length != 2) {
				throw new Exception("认证无效！");
			}
			int pos = postdata.indexOf("=");
			String n = postdata.substring(0,pos);
			String v = postdata.substring(pos+1);
			//Logs.info(n+":"+v);
			// 字符转换成JSON对象
			JSONObject jso = new JSONObject();
			// 添加udid, timestamp
			jso.put("udid", hds[0]);
			jso.put("timestamp", hds[1]);
			jso.put(n, v);
			
			
			// 转换成ArrayList
			ArrayList<String> list = new ArrayList<String>();
			// 排序
			JSONArray ja = jso.names();

			int len = ja.length();
			for (int i = 0; i < len; i++) {
				list.add(ja.get(i).toString());
			}
			Collections.sort(list);

			// 把KEY和VALUE连接成串
			String name = "";
			StringBuffer sb = new StringBuffer();
			for (int i = 0; i < len; i++) {
				name = list.get(i);		
				if(!name.equals("sign"))
				{
					sb.append(name + jso.getString(name));
				}
			}
			// 前后增加密钥串
			
			// md5 大写
			//Logs.info("+++++++++++++"+passkey+sb.toString()+passkey);
			sign = encodeByMD5(passkey+sb.toString()+passkey).toUpperCase();
			//Logs.info(sign);
		} catch (Exception e) {
			throw e;
		}

		return sign;
	}

	/**
	 * encode string
	 * 
	 * @param algorithm
	 * @param str
	 * @return String
	 */
	public static String encode(String algorithm, String str) {
		if (str == null) {
			return null;
		}
		try {
			MessageDigest messageDigest = MessageDigest.getInstance(algorithm);
			messageDigest.update(str.getBytes());
			return getFormattedText(messageDigest.digest());
		} catch (Exception e) {
			throw new RuntimeException(e);
		}

	}

	/**
	 * encode By MD5
	 * 
	 * @param str
	 * @return String
	 */
	public static String encodeByMD5(String str) {
		if (str == null) {
			return null;
		}
		try {
			MessageDigest messageDigest = MessageDigest.getInstance("MD5");
			messageDigest.update(str.getBytes());
			return getFormattedText(messageDigest.digest());
		} catch (Exception e) {
			throw new RuntimeException(e);
		}

	}

	/**
	 * Takes the raw bytes from the digest and formats them correct.
	 * 
	 * @param bytes
	 *            the raw bytes from the digest.
	 * @return the formatted bytes.
	 */
	private static String getFormattedText(byte[] bytes) {
		int len = bytes.length;
		StringBuilder buf = new StringBuilder(len * 2);
		// 把密文转换成十六进制的字符串形式
		for (int j = 0; j < len; j++) {
			buf.append(HEX_DIGITS[(bytes[j] >> 4) & 0x0f]);
			buf.append(HEX_DIGITS[bytes[j] & 0x0f]);
		}
		return buf.toString();
	}
	
	public static String utf8ToUnicode(String inStr)  
    {  
        char[] myBuffer = inStr.toCharArray();  
        
        StringBuffer sb = new StringBuffer();  
        for (int i = 0; i < inStr.length(); i++)  
        {  
            UnicodeBlock ub = UnicodeBlock.of(myBuffer[i]);  
            if(myBuffer[i]=='&')
            {
            	sb.append("\\u0026".toLowerCase());
            	continue;
            }
            if (ub == UnicodeBlock.BASIC_LATIN)  
            {  
                // 英文及数字等  
                sb.append(myBuffer[i]);  
            }  
            else if (ub == UnicodeBlock.HALFWIDTH_AND_FULLWIDTH_FORMS)  
            {  
                // 全角半角字符  
                int j = (int) myBuffer[i] - 65248;  
                sb.append((char) j);  
            }  
            else  
            {  
                // 汉字  
                int s = (int) myBuffer[i];  
                String hexS = Integer.toHexString(s);  
                String unicode = "\\u" + hexS;  
                sb.append(unicode.toLowerCase());  
            }  
        }  
        return sb.toString();  
    }  	
}