package com.dishui.ip;

import com.dishui.ip.db.IP;
import com.dishui.ip.db.IPConfig;
import com.dishui.ip.db.IPService;
import com.dishui.util.HttpProvider;

import java.io.*;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.List;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.logging.Logger;

/**
 * 每天0点检查ip库版本,如果不是最新的,删除当前ip库,重新录入数据,建立索引.
 *
 * Created by jackwong on 16/3/15.
 */
public class UpgradeWorker implements  Runnable {
    Logger logger = Logger.getLogger(UpgradeWorker.class.getName());

    private static int INSERT_BUFFER_SIZE = 1000;//一次插入多少条ip

    @Override
    public void run() {
        //拒绝在0点23点之外的时间段执行
        Calendar now = Calendar.getInstance();
        if(now.get(Calendar.HOUR_OF_DAY) != 0 && now.get(Calendar.HOUR_OF_DAY) != 23){
            return;
        }

        doUpgrade();
    }

    private void doUpgrade(){
        IPConfig ipConfig= IPService.getConfig();

        String remoteVersion = getRemoteVersion(ipConfig.getDownloadToken());
        String localVersion = ipConfig.getVersion();
        if(remoteVersion==null || remoteVersion.equals("token error") || remoteVersion.equals(localVersion)){
            return;
        }

        String downloadFilePath = downloadFromRemote(ipConfig.getDownloadToken());
        if(downloadFilePath==null){
            logger.warning("upgrade failed,cause ip file download failed");
            return;
        }

        int insertCount = readAndPersist(downloadFilePath);
        //更新版本号
        if(insertCount > 0){
            IPService.updateVersion(remoteVersion,insertCount);
            logger.info("success to upgrade ip library to version " + remoteVersion);
        }

        //替换Redis上的IP库.TODO
    }

    private String getRemoteVersion(String apiToken) {
        try {
            return HttpProvider.sendGet("http://user.ipip.net/download.php?a=version&token="+apiToken);
        } catch (Exception e) {
            logger.warning("get ip version failed."+e.getMessage());
            return null;
        }
    }

    private int readAndPersist(String ipFilePath){
        File ipFile = new File(ipFilePath);
        if(!ipFile.isFile()){
            return -1;
        }

        //录入ip到临时表
        BufferedReader br = null;
        try{
            br = new BufferedReader(new FileReader(ipFile));

            List<IP> ipList = new ArrayList<IP>();
            String line;
            int count = 0;
            while ((line = br.readLine()) != null) {
                IP ip = IP.fromTXTXLine(line);
                if(ip != null){
                    ipList.add(ip);
                    count++;
                }

                if(count % INSERT_BUFFER_SIZE == 0){
                    IPService.batchSave(ipList,Constants.DB_COLLECTION_TEMP_IP_POOL);
                    ipList.clear();
                }
            }

            if(!ipList.isEmpty()){
                IPService.batchSave(ipList,Constants.DB_COLLECTION_TEMP_IP_POOL);
            }

            Executors.newScheduledThreadPool(1).schedule(new Runnable() {
                @Override
                public void run() {
                    //在临时表上建索引
                    IPService.createIPPoolIndex(Constants.DB_COLLECTION_TEMP_IP_POOL);

                    //删除原表,把临时表改名成为正式表
                    IPService.transTempIPPool();

                }
            },2, TimeUnit.MINUTES);

            logger.info("persist ip " + count);
            return count;
        } catch (Exception e) {
            logger.warning("read and persist ip file failed."+ e.getMessage());
            return -1;
        }finally {
            //删除ip文件及临时文件夹
            ipFile.delete();
            new File(ipFile.getParent()).delete();

            try {
                br.close();
            }catch (IOException e){
                logger.warning("stream close failed." + e.getMessage());
            }
        }
    }

    private String downloadFromRemote(String token){
        File tempDir = null;
        try {
            tempDir = createTempDirectory();

            String url = "http://user.ipip.net/download.php?type=txtx&token=" + token;
            return HttpProvider.downloadFile(url,tempDir.getCanonicalPath());
        } catch (Exception e) {
            if(tempDir!=null){
                tempDir.delete();
            }
            logger.warning("create temp directory failed" + e.getMessage());
        }

        return null;
    }



    private File createTempDirectory() throws IOException {
        final File temp;

        temp = File.createTempFile("temp", Long.toString(System.nanoTime()));

        if(!(temp.delete()))
        {
            throw new IOException("Could not delete temp file: " + temp.getAbsolutePath());
        }

        if(!(temp.mkdir()))
        {
            throw new IOException("Could not create temp directory: " + temp.getAbsolutePath());
        }

        return temp;
    }
}


