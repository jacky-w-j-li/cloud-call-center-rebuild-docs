package com.dishui.server.http;

import java.io.File;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.dishui.kdxf.MscUtils;
import com.dishui.manager.command.C5Action;
import com.dishui.manager.command.C5Response;
import com.dishui.manager.service.AppConfig;
import com.dishui.manager.service.Utils;

public class AppServiceHander {
    private static final Logger log = Logger.getLogger(AppHttpHandler.class.getName());

    public static C5Response generateWav(C5Action action) {
        C5Response response = new C5Response(action);
        try {
            String text = action.getStringValue("text");
            String vocieName = action.getStringValue("voiceName");
            String speed = action.getStringValue("speed");
            String pitch = action.getStringValue("pitch");
            String volume = action.getStringValue("volume");

            File tempWavDir =new File(AppConfig.getInstance().getWavTempDir());
            File wavDir =new File(AppConfig.getInstance().getWavDir());
            if(!tempWavDir.exists()){
                tempWavDir.mkdir();
            }
            if(!wavDir.exists()){
                wavDir.mkdir();
            }
            String fileName = Utils.getUniqueid()+".wav";
            MscUtils.getInstance().Synthesize(text, fileName, vocieName,
                    speed, pitch, volume);

            File tmpFile = new File(AppConfig.getInstance().getWavTempDir() + fileName);
            boolean iskdxfOk = false;
            for(int i=0 ; i<600 ; i++){
                if(MscUtils.getInstance().getTmpFileExists(fileName)){
                    if(tmpFile.exists()){
                        iskdxfOk = true;
                        break;
                    }
                }else{
                    Thread.sleep(50);
                }
            }
            if(iskdxfOk) {
                String tempFile = AppConfig.getInstance().getWavTempDir()
                        + fileName;
                String _file = AppConfig.getInstance().getWavDir()
                        + fileName;
                Process process = Runtime.getRuntime().exec(AppConfig.getInstance().getSox() + " "
                        + tempFile + " -c 1 -r 8000 -A -2 " + _file);
                process.waitFor();
                process.destroy();
                response.addParameter("WavName", fileName);
                response.setSucceed(true);
            }else{
                response.setSucceed(false);
            }
        } catch (Exception e) {
            e.printStackTrace();
            log.log(Level.WARNING, "", e);
            response.setSucceed(false);
            response.addParameter("result", "500");
            response.setMessage(e.getMessage());
        }
        return response;
    }

}
