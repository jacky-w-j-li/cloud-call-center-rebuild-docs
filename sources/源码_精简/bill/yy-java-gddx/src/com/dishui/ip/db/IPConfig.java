package com.dishui.ip.db;

import com.mongodb.DBObject;

/**
 * Created by jackwong on 16/3/15.
 */
public class IPConfig {
    /**
     * 当前ip库版本号
     */
    private String version;
    /**
     * api访问令牌
     */
    private String apiToken;
    /**
     * 下载令牌
     */
    private String downloadToken;

    public static IPConfig fromDB(DBObject dbObj){
        if(dbObj == null){
            return null;
        }
        IPConfig ipConfig = new IPConfig();

        String dbVersion = (String)dbObj.get("version");
        String dbApiToken = (String)dbObj.get("api_token");
        String dbDownloadToken = (String)dbObj.get("download_token");

        ipConfig.setVersion(dbVersion);
        ipConfig.setApiToken(dbApiToken);
        ipConfig.setDownloadToken(dbDownloadToken);

        return ipConfig;
    }
    public String getVersion() {
        return version;
    }

    public void setVersion(String version) {
        this.version = version;
    }

    public String getApiToken() {
        return apiToken;
    }

    public void setApiToken(String apiToken) {
        this.apiToken = apiToken;
    }

    public String getDownloadToken() {
        return downloadToken;
    }

    public void setDownloadToken(String downloadToken) {
        this.downloadToken = downloadToken;
    }
}
