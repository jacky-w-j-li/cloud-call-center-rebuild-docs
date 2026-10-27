package com.alipay.config;

/* *
 *类名：AlipayConfig
 *功能：基础配置类
 *详细：设置帐户有关信息及返回路径
 *版本：3.3
 *日期：2012-08-10
 *说明：
 *以下代码只是为了方便商户测试而提供的样例代码，商户可以根据自己网站的需要，按照技术文档编写,并非一定要使用该代码。
 *该代码仅供学习和研究支付宝接口使用，只是提供一个参考。
	
 *提示：如何获取安全校验码和合作身份者ID
 *1.用您的签约支付宝账号登录支付宝网站(www.alipay.com)
 *2.点击“商家服务”(https://b.alipay.com/order/myOrder.htm)
 *3.点击“查询合作者身份(PID)”、“查询安全校验码(Key)”

 *安全校验码查看时，输入支付密码后，页面呈灰色的现象，怎么办？
 *解决方法：
 *1、检查浏览器配置，不让浏览器做弹框屏蔽设置
 *2、更换浏览器或电脑，重新登录查询。
 */

public class AlipayConfig {

    //↓↓↓↓↓↓↓↓↓↓请在这里配置您的基本信息↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓
    // 合作身份者ID，以2088开头由16位纯数字组成的字符串
    public static String partner = "2088411931388765";
    // 商户的私钥
    public static String key = "6cbwo4be1ox0b4es37kvykcjmq5ps1ya";
    //卖家支付宝帐户
    public static String sellerEmail = "business@7moor.com";
    //↑↑↑↑↑↑↑↑↑↑请在这里配置您的基本信息↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑

    public static String partner_rl7moor = "2088021024335165";
    public static String key_rl7moor = "gyp4h0cvt8c18cio3lo007kjnxko4w6h";
    public static String sellerEmail_rl7moor = "moor@7moor.com";
    // 调试用，创建TXT日志文件夹路径
    public static String log_path = "./log";

    // 字符编码格式 目前支持 gbk 或 utf-8
    public static String input_charset = "utf-8";

    // 签名方式 不需修改
    public static String sign_type = "MD5";

    public static String companyFlag_rl="rl7moor";


    public static String getKey(String company){
        String key=AlipayConfig.key;
        if(AlipayConfig.companyFlag_rl.equals(company)){
            key=AlipayConfig.key_rl7moor;
        }
        return key;
    }
    public static String getPartner(String company){
        String key=AlipayConfig.partner;
        if(AlipayConfig.companyFlag_rl.equals(company)){
            key=AlipayConfig.partner_rl7moor;
        }
        return key;
    }

    public static String getSellerEmail(String company){
        String key=AlipayConfig.sellerEmail;
        if(AlipayConfig.companyFlag_rl.equals(company)){
            key=AlipayConfig.sellerEmail_rl7moor;
        }
        return key;
    }
}
