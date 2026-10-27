package com.dishui.config;

import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.io.Writer;

/**
 * This class can parser a configure file and convert it to a 
 * {@link Configure} object.
 * It also can save a {@link Configure} object into
 * configure file.
 * Not support #include in @vesion 1.0.0
 * 
 * @author caif
 * @since 1.0.0
 */
public class ConfParser {

	/**
	 * Parser a configure file.
	 * 
	 * @param confFile the file path and name of the configure file.
	 * @param charset which charset should we ues to read this file.
	 * @return Confiure
	 * @throws ConfigureParserException
	 * @throws java.io.IOException
	 */
	public static Configure parser(String confFile, String charset)
			throws ConfigureParserException, IOException {

		Configure conf = new Configure(confFile);

		// Check configure file
		if (confFile == null || confFile.equalsIgnoreCase("")) {
			throw new ConfigureParserException(
					"Can not load configure file, it is null");
		}

		File file = new File(confFile);
		if (!file.exists()) {
			throw new ConfigureParserException("Can not find configure file ["
					+ confFile + "].");
		}

		if (!file.canRead()) {
			throw new ConfigureParserException("Can not read configure file ["
					+ confFile + "].");
		}

		// Start loading
		BufferedReader br = new BufferedReader(new InputStreamReader(
				new FileInputStream(file), charset));
		String line;
		String name;
		ConfPeer peer = null;
		String comments = "";
		while ((line = br.readLine()) != null) {
			line = line.trim();
			// ignore comments
			if (line.startsWith(";")) {
				comments = comments + line + "\r\n";
				continue;
			}
			// this line is a peer
			if (line.startsWith("[") && line.endsWith("]")) {
				name = line.substring(line.indexOf('[') + 1, line.indexOf(']'))
						.trim();
				peer = new ConfPeer(name);
				peer.setComments(comments);
				comments = "";
				conf.addPeer(peer);
			}
			// a parameter line
			else {
				// If there is no peer or the peer error, omit this parameter
				if (peer == null)
					continue;
				int a = -1;
				if((a = line.indexOf("=")) == -1){
					continue;
				}
				String param = line.substring(0, a);
				String value = line.substring(a + 1, line.length());

				peer.addParam(param.trim(), value.trim());
			}
		}
		br.close();
		return conf;
	}

	/**
	 * Save a {@link com.dishui.config.Configure} into configure file
	 * @param configure the Configure object
	 * @param charset which charset we should use to write this file
	 * @throws ConfigureParserException
	 * @throws java.io.IOException
	 */
	public static void saveConf(Configure configure, String charset)
			throws ConfigureParserException, IOException {
		
		if (configure == null)
			throw new ConfigureParserException(
					"Can not save configure file, it is null");

		File file = new File(configure.getName());
		if (!file.exists())
			file.createNewFile();
		StringBuffer sb = new StringBuffer();
		ConfPeer[] peers = configure.getAllPeers();
		for(int i=0;i<peers.length;i++){
			sb.append(peers[i].toString() + ConfigProvider.newLine  + ConfigProvider.newLine);
		}
		Writer out = new BufferedWriter(new OutputStreamWriter(
				new FileOutputStream(file), charset));
		out.write(sb.toString());
		out.flush();
		out.close();
	}
}
