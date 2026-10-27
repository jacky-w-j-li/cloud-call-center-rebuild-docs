package com.dishui.util;


import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class CommonUtil {
    public static String clearPhone(String phone) {
        String reg1 = "^(86|086|\\+86)";
        String reg2 = "[-_ ]";
        Pattern p = Pattern.compile(reg1);
        Matcher m = p.matcher(phone);
        phone= m.replaceAll("");

        p = Pattern.compile(reg2);
        m = p.matcher(phone);
        phone= m.replaceAll("");
        return phone;
    }

}
