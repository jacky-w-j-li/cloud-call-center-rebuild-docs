package com.dishui.util;

import com.dishui.bill.service.AppConfig;

import java.util.ArrayList;
import java.util.HashMap;

/**
 * Created by chenguang on 5/8/15.
 */
public class SmsForbiddenWordCheckUtil {

    public static HashMap<String,ArrayList<String>> indexMap = new HashMap<String,ArrayList<String>>();
    public static HashMap<String,HashMap<String,Boolean>> numMap = new HashMap<String,HashMap<String,Boolean>>();

    public static void initUtil(){
        ArrayList<String> allWords = AppConfig.getInstance().getFobiddenWords();
        for(int i=0;i<allWords.size();i++){
            String firstChar = allWords.get(i).substring(0,1);
            if(indexMap.containsKey(firstChar)){
                indexMap.get(firstChar).add(allWords.get(i).length()+"");
            }else{
                ArrayList<String> tmplist = new ArrayList<String>();
                tmplist.add(allWords.get(i).length()+"");
                indexMap.put(firstChar, tmplist);
            }

            if(numMap.containsKey(allWords.get(i).length()+"")){
                numMap.get(allWords.get(i).length()+"").put(allWords.get(i),true);
            }else{
                HashMap<String,Boolean> tmpMap = new HashMap<String,Boolean>();
                tmpMap.put(allWords.get(i),true);
                numMap.put(allWords.get(i).length()+"", tmpMap);
            }
        }
        System.out.println("=====checkWord init ok===indexMap size=" + indexMap.size());
    }

    public static String checkWord(String words){
        char[] arrs = words.toCharArray();
        for(int i=0;i<arrs.length;i++){
            if(indexMap.containsKey(String.valueOf(arrs[i]))){
                ArrayList<String> curList = indexMap.get(String.valueOf(arrs[i]));
                for(int j=0;j<curList.size();j++){
                    if(words.length() - i >=  Integer.parseInt(curList.get(j))){
                        if(numMap.get(curList.get(j)).containsKey(words.substring(i,i+Integer.parseInt(curList.get(j))))){
                            return words.substring(i,i+Integer.parseInt(curList.get(j)));
                        }
                    }
                }
            }
        }
        return "true";
    }

    public static void main(String[] args){
        System.out.println("=====checkWord===" +
                SmsForbiddenWordCheckUtil.checkWord("您好，去哪儿网（专业旅行搜索引擎），邀您周三下午2点半面试机票事业部“客户咨询”岗，地址：海淀区西小口路66号中关村东升科技园（北领地）B-2号楼4层。地铁8号线西小口站C口出东南约500米。曲主管：13391632590 "));

    }
}
