package com.m7.cc.config;

import java.io.IOException;

/**
 * This class is used for user to read and parser configuration, to write and
 * save configuration. The default charset for reading and writting configure
 * file is UTF-8.
 * 
 * @author caif
 * @since 1.0.0
 */
public class ConfigProvider {

	/**
	 * Charset used to write configure file.
	 */
	private String writeCharset = "UTF-8";

	/**
	 * Charset used to read configure file.
	 */
	private String readCharset = "UTF-8";
	
	/**
	 * The new line char, it is a globale value
	 */
	public static String newLine = "\r\n";

	public ConfigProvider() {
	}

	/**
	 * Read a configure file and parser it. Then return results as a Configure
	 * instance.
	 * @param confFile the path+fileName of the configure file.
	 * @return Configure instance
	 * @throws ConfigureParserException
	 * @throws IOException
	 */
	public Configure parser(String confFile) throws ConfigureParserException,
			IOException {
		return ConfParser.parser(confFile, readCharset);
	}
	
	/**
	 * Write configure into file with specific chartset.
	 * @param configure the configure object instance
	 * @throws ConfigureParserException
	 * @throws IOException
	 */
	public void save(Configure configure) throws ConfigureParserException, IOException{
		ConfParser.saveConf(configure, writeCharset);
	}

	/**
	 * Get charset that is used to read configure file.
	 * 
	 * @return charset
	 */
	public String getReadCharset() {
		return readCharset;
	}

	/**
	 * Set the charset to read configure file
	 * 
	 * @param readCharset
	 */
	public void setReadCharset(String readCharset) {
		this.readCharset = readCharset;
	}

	/**
	 * Get charset that is used to write configure file.
	 * 
	 * @return
	 */
	public String getWriteCharset() {
		return writeCharset;
	}

	/**
	 * Get charset that is used to write configure file.
	 * 
	 * @param writeCharset
	 */
	public void setWriteCharset(String writeCharset) {
		this.writeCharset = writeCharset;
	}
}
