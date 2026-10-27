package com.m7.cc.ass.config;

import java.io.BufferedWriter;
import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.util.List;
import java.util.TimerTask;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.ass.config.model.CallNumberInfo;
import com.m7.cc.util.Utils;

public class CallNumberInfoTask extends TimerTask {
	private Logger log = Logger.getLogger(CallNumberInfoTask.class.getName());

	@Override
	public void run() {
		BufferedWriter bw = null;
		File phoneFile = new File("phone");
		try {
			if (!phoneFile.exists()) {
				log.log(Level.WARNING, "The phone file not found.");
				return;
			}

			List<CallNumberInfo> newCallNumberInfoList = ASConfig.getInstance()
					.getNewCallNumberInfoCache();
			if (newCallNumberInfoList.size() > 0) {
				StringBuilder builder = new StringBuilder();
				CallNumberInfo info = null;
				for (int i = 0, len = newCallNumberInfoList.size(); i < len; i++) {
					info = newCallNumberInfoList.get(i);
					if (info != null) {
						String province = Utils.unicodeToGB(info.getProvince());
						String city = Utils.unicodeToGB(info.getCity());
						builder.append(info.getSegment()).append("|")
								.append(province).append("|")
								.append(city).append("|")
								.append(info.getDistrictNo()).append("\n");
					}
				}
				bw = new BufferedWriter(new FileWriter(phoneFile, true), 1024);
				bw.write(builder.toString());
				bw.flush();
				newCallNumberInfoList.clear();
				log.info("The phone file has updated.");
			}
		} catch (IOException e) {
			log.log(Level.WARNING, "Update phone file failure.", e);
		} finally {
			if (bw != null) {
				try {
					bw.close();
				} catch (IOException e) {
					e.printStackTrace();
				}
				bw = null;
				phoneFile = null;
			}
		}
	}
}
