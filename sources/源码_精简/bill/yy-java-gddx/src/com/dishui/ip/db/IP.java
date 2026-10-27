package com.dishui.ip.db;

import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;

/**
 * Created by jackwong on 16/3/15.
 */
public class IP {
    private static int IP_ATTR_COUNT = 15;

    private String id;

    /**
     *    ip_start ip段开始
     */
    private String ipStart;
    /**
     *    ip_end ip段结束
     */
    private String ipEnd;
    /**
     *     nation 国家
     */
    private String nation;
    /**
     *     province 省会直辖市
     */
    private String province;
    /**
     *    city 城市地区
     */
    private String city;
    /**
     *     street 学校或单位
     */
    private String street;
    /**
     *     operator 运营商
     */
    private String operator;
    /**
     *     latitude 纬度
     */
    private String latitude;
    /**
     *     longitude 经度
     */
    private String longitude;
    /**
     *     timezone1 时区1
     */
    private String timezone1;
    /**
     *    timezone2 时区2
     */
    private String timezone2;
    /**
     *    area_code 行政区划代码
     */
    private String areaCode;
    /**
     *    intl_tel_code 国际电话代码
     */
    private String intlTelCode;
    /**
     *    nation_code 国家二位代码
     */
    private String nationCode;
    /**
     *    continent_code 世界大洲代码
     */
    private String continentCode;

    public DBObject toDB(){
        BasicDBObject dbObject = new BasicDBObject();

        dbObject.append("_id",this.ipStart + "-" +this.ipEnd)
                .append("ip_start",this.ipStart)
                .append("ip_end",this.ipEnd)
                .append("nation",this.nation)
                .append("province",this.province)
                .append("city",this.city)
                .append("street",this.city)
                .append("operator",this.operator)
                .append("latitude",this.latitude)
                .append("longitude",this.longitude)
                .append("timezone1",this.timezone1)
                .append("timezone2",this.timezone2)
                .append("area_code",this.areaCode)
                .append("intl_tel_code",this.intlTelCode)
                .append("nation_code",this.nationCode)
                .append("continent_code",this.continentCode);

        return dbObject;
    }

    public static IP fromTXTXLine(String line){
        if(line == null){
            return null;
        }
        String[] ipAttrs = line.split("\\s+");

        if(ipAttrs==null || ipAttrs.length < IP_ATTR_COUNT){
            return null;
        }

        int index = 0;
        IP ip = new IP();
        ip.setIpStart(ipAttrs[index++]);
        ip.setIpEnd(ipAttrs[index++]);
        ip.setNation(ipAttrs[index++]);
        ip.setProvince(ipAttrs[index++]);
        ip.setCity(ipAttrs[index++]);
        ip.setStreet(ipAttrs[index++]);
        ip.setOperator(ipAttrs[index++]);
        ip.setLatitude(ipAttrs[index++]);
        ip.setLongitude(ipAttrs[index++]);
        ip.setTimezone1(ipAttrs[index++]);
        ip.setTimezone2(ipAttrs[index++]);
        ip.setAreaCode(ipAttrs[index++]);
        ip.setIntlTelCode(ipAttrs[index++]);
        ip.setNationCode(ipAttrs[index++]);
        ip.setContinentCode(ipAttrs[index++]);

        return ip;
    }

    public String getIpStart() {
        return ipStart;
    }

    public void setIpStart(String ipStart) {
        this.ipStart = ipStart;
    }

    public String getIpEnd() {
        return ipEnd;
    }

    public void setIpEnd(String ipEnd) {
        this.ipEnd = ipEnd;
    }

    private String convertIP(String ip){
        if(ip == null){
            return null;
        }
        String[] segArr = ip.split("\\.");

        StringBuffer newIp = new StringBuffer();
        for (String seg : segArr){
            newIp.append(Integer.parseInt(seg));
            newIp.append(".");
        }
        newIp.deleteCharAt(newIp.length()-1);

        return newIp.toString();
    }

    public String getNation() {
        return nation;
    }

    public void setNation(String nation) {
        this.nation = nation;
    }

    public String getProvince() {
        return province;
    }

    public void setProvince(String province) {
        this.province = province;
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public String getStreet() {
        return street;
    }

    public void setStreet(String street) {
        this.street = street;
    }

    public String getOperator() {
        return operator;
    }

    public void setOperator(String operator) {
        this.operator = operator;
    }

    public String getLatitude() {
        return latitude;
    }

    public void setLatitude(String latitude) {
        this.latitude = latitude;
    }

    public String getLongitude() {
        return longitude;
    }

    public void setLongitude(String longitude) {
        this.longitude = longitude;
    }

    public String getTimezone1() {
        return timezone1;
    }

    public void setTimezone1(String timezone1) {
        this.timezone1 = timezone1;
    }

    public String getTimezone2() {
        return timezone2;
    }

    public void setTimezone2(String timezone2) {
        this.timezone2 = timezone2;
    }

    public String getAreaCode() {
        return areaCode;
    }

    public void setAreaCode(String areaCode) {
        this.areaCode = areaCode;
    }

    public String getIntlTelCode() {
        return intlTelCode;
    }

    public void setIntlTelCode(String intlTelCode) {
        this.intlTelCode = intlTelCode;
    }

    public String getNationCode() {
        return nationCode;
    }

    public void setNationCode(String nationCode) {
        this.nationCode = nationCode;
    }

    public String getContinentCode() {
        return continentCode;
    }

    public void setContinentCode(String continentCode) {
        this.continentCode = continentCode;
    }


    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }
}
