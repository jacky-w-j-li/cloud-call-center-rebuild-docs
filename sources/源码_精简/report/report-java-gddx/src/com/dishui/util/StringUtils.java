package com.dishui.util;

/**
 * Created by yaxi on 15-11-6.
 */
public class StringUtils {
    public static int parseInt(String numStr){
        int num = 0;
        try{
            num = Integer.parseInt(numStr);
        }catch (Exception e){
            num = 0;
        }
        return num;
    }
}
