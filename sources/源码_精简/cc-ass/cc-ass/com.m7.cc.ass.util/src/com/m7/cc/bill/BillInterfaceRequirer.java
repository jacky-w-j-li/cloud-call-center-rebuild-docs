package com.m7.cc.bill;

import java.util.Map;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.command.Fields;
import com.m7.cc.json.JSONReader;
import com.m7.cc.url.HttpProvider;

public class BillInterfaceRequirer {
	private static Logger log = Logger.getLogger(BillInterfaceRequirer.class
			.getName());

	public static Object require(String url, int timeout) {
		log.info("Send require to bill system:\n" + url);
		try {
			String result = HttpProvider.sendGet(url, timeout);
			if (result == null || result.equalsIgnoreCase("")) {
				log.warning("Get empty return from bill system.");
				return null;
			}
			log.info("Get result from " + url + "\n" + result);
			JSONReader reader = new JSONReader();
			Map<String, Object> map = (Map<String, Object>) reader.read(result);
			if(map.containsKey(Fields.BillInterSuccess)){
				if(Boolean.valueOf(map.get(Fields.BillInterSuccess).toString())){
					if (map.containsKey(Fields.BillInterfaceData)) {
						log.info("Get result from data:" + map.get(Fields.BillInterfaceData));
						return map.get(Fields.BillInterfaceData);
					}else{
						log.warning("Result 'data' not found from bill system return:\n"
								+ url);
					}
				}else {
					String message = "";
					if(map.containsKey(Fields.BillInterMessage)){
						message = map.get(Fields.BillInterMessage).toString();
					}
					log.warning("Result 'success' is not 'true' from bill system return:\n"+ 
					url+". Message="+message);
				}
			}else {
				log.warning("Result 'success' not found from bill system return:\n"
						+ url);
			}
//			if (map.containsKey(Fields.BillInterfaceResultCode)) {
//				if (map.get(Fields.BillInterfaceResultCode).toString()
//						.equals("0000")) {
//					if (map.containsKey(Fields.BillInterfaceData)) {
//						Map<String, Object> data = (Map<String, Object>) map
//								.get(Fields.BillInterfaceData);
//						if (data.containsKey(Fields.BillInterfaceSuccess)
//								&& Boolean
//										.valueOf(data.get(
//												Fields.BillInterfaceSuccess)
//												.toString())) {
//							if ((data.containsKey(Fields.BillInterfaceStatus) && data
//									.get(Fields.BillInterfaceStatus).toString()
//									.equals("200"))
//									|| !data.containsKey(Fields.BillInterfaceStatus)) {
//								if (data.containsKey(Fields.BillInterfaceInfo)) {
//									return data.get(Fields.BillInterfaceInfo);
//								}
//							}
//						} else {
//							log.warning("Success is not true from bill system return:\n"
//									+ url);
//						}
//					} else {
//						log.warning("Data not found from bill system return:\n"
//								+ url);
//					}
//				} else {
//					log.warning("Result code is not 0000 from bill system return:\n"
//							+ url);
//				}
//			} 
		} catch (Exception e) {
			log.log(Level.WARNING,
					"Send require to bill system faiulre:" + url, e);
		}
		return null;
	}
}
