package com.dishui.config;

import com.dishui.service.manager.NotificationService;
import com.dishui.service.manager.WebchatAutoClose;
import com.dishui.service.manager.WebchatWeixinRemind;

import java.util.HashMap;
import java.util.Map;

/**
 * Created by zengyx on 16/10/9.
 */
public class NotificationConfig {
    public static Map<String, NotificationService> notificationConfigMap = new HashMap<String, NotificationService>();

    static{
        notificationConfigMap.put("webchatAutoClose", WebchatAutoClose.getInstance());
        notificationConfigMap.put("webchatWeixinRemind", WebchatWeixinRemind.getInstance());
        
    }
}
