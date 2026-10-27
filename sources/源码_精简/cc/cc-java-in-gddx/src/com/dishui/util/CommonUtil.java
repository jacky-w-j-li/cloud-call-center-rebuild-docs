package com.dishui.util;


import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class CommonUtil {
    public static String clearPhone(String phone) {
        String reg1 = "^(86|086|\\+86)";
        String reg2 = "[-_ ]";
        Pattern p;
        Matcher m;
        if(phone!=null && phone.length()>11){
            p = Pattern.compile(reg1);
            m = p.matcher(phone);
            phone= m.replaceAll("");
        }
        p = Pattern.compile(reg2);
        m = p.matcher(phone);
        phone= m.replaceAll("");
        return phone;
    }
    public static String escapeRegex(String str) {
        try {
            String reg = "[\\-\\[\\]{}()*+?.,\\\\\\^$|#\\s]";
            Pattern p = Pattern.compile(reg);
            Matcher m = p.matcher(str);
            while (m.find()){
                String temp=m.group();
                str=str.replace(temp,"\\"+temp);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return str;
    }
    public static String clearCustName(String name) {
//        String reg1 = "(\\s|\\&nbsp\\;| |\\xc2\\xa0)";
        String reg1 = "(\\s|&nbsp;)";
        Pattern p = Pattern.compile(reg1);
        Matcher m = p.matcher(name);
        name= m.replaceAll("");
        return name;
    }
}
