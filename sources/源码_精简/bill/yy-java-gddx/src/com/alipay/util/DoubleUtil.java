package com.alipay.util;

import java.math.BigDecimal;
import java.text.DecimalFormat;
import java.text.NumberFormat;
import java.util.Random;
import java.util.logging.Logger;




public class DoubleUtil {
	private static Logger logger = Logger.getLogger(DoubleUtil.class.getName());
	// 默认除法运算精度
	private static final int DEF_DIV_SCALE = 2;

	private DoubleUtil() {
	}

	/**
	 * 实现浮点数的加法运算功能
	 * 
	 * @param v1
	 *            加数1
	 * @param v2
	 *            加数2
	 * @return v1+v2的和
	 */
	public static double add(double v1, double v2) {
		BigDecimal b1 = new BigDecimal(Double.toString(v1));
		BigDecimal b2 = new BigDecimal(Double.toString(v2));
		return b1.add(b2).doubleValue();
	}

	/**
	 * 实现浮点数的减法运算功能
	 * 
	 * @param v1
	 *            被减数
	 * @param v2
	 *            减数
	 * @return v1-v2的差
	 */
	public static double sub(double v1, double v2) {
		BigDecimal b1 = new BigDecimal(Double.toString(v1));
		BigDecimal b2 = new BigDecimal(Double.toString(v2));
		return b1.subtract(b2).doubleValue();
	}

	/**
	 * 实现浮点数的乘法运算功能
	 * 
	 * @param v1
	 *            被乘数
	 * @param v2
	 *            乘数
	 * @return v1×v2的积
	 */
	public static double multi(double v1, double v2) {
		BigDecimal b1 = new BigDecimal(Double.toString(v1));
		BigDecimal b2 = new BigDecimal(Double.toString(v2));
		return b1.multiply(b2).doubleValue();
	}

	/**
	 * 实现浮点数的除法运算功能 当发生除不尽的情况时，精确到小数点以后DEF_DIV_SCALE位(默认为10位)，后面的位数进行四舍五入。
	 * 
	 * @param v1
	 *            被除数
	 * @param v2
	 *            除数
	 * @return v1/v2的商
	 */
	public static double div(double v1, double v2) {
		BigDecimal b1 = new BigDecimal(Double.toString(v1));
		BigDecimal b2 = new BigDecimal(Double.toString(v2));
		return b1.divide(b2, DEF_DIV_SCALE, BigDecimal.ROUND_HALF_UP).doubleValue();
	}

	/**
	 * 实现浮点数的除法运算功能 当发生除不尽的情况时，精确到小数点以后scale位，后面的位数进行四舍五入。
	 * 
	 * @param v1
	 *            被除数
	 * @param v2
	 *            除数
	 * @param scale
	 *            表示需要精确到小数点以后几位
	 * @return v1/v2的商
	 */
	public static double div(double v1, double v2, int scale) {
		if (scale < 0) {
			logger.info("小数位数小于0");
			throw new IllegalArgumentException("The scale must be a positive integer or zero");
		}
		BigDecimal b1 = new BigDecimal(Double.toString(v1));
		BigDecimal b2 = new BigDecimal(Double.toString(v2));
		return b1.divide(b2, scale, BigDecimal.ROUND_HALF_UP).doubleValue();
	}

	/**
	 * 提供精确的小数位四舍五入功能
	 * 
	 * @param v
	 *            需要四舍五入的数字
	 * @param scale
	 *            小数点后保留几位
	 * @return 四舍五入后的结果
	 */
	public static double round(double v, int scale) {
		if (scale < 0) {
			logger.info("小数位数小于0");
			throw new IllegalArgumentException("The scale must be a positive integer or zero");
		}
		BigDecimal b = new BigDecimal(Double.toString(v));
		BigDecimal one = new BigDecimal("1");
		return b.divide(one, scale, BigDecimal.ROUND_HALF_UP).doubleValue();
	}
	public static String strFormat(double v){
		BigDecimal b1 = new BigDecimal(Double.toString(v));
		return b1.toString();
	}	
	public static void main(String[] args) {
		
		NumberFormat numberFormat = NumberFormat.getNumberInstance();
		numberFormat.setMaximumFractionDigits(2);
		double leftfare =30.1;
		double overfare = 20.128;
		float leftfare2 =60;
		float overfare2 = 3.1f;
		System.out.println(div(leftfare,overfare,2));
		System.out.println(round(leftfare2/overfare2,2));
		
		System.out.println(leftfare2*overfare2);
		System.out.println(numberFormat.format(leftfare2*overfare2));
		
		
		float f = 20014899;
		double d = f;
		double d2 = 20014999;
		System.out.println("f=" + f);
		System.out.println("d=" + d);
		System.out.println("d2=" + d2);
		System.out.println(div(d2,overfare));

/*		double i = 2.56;
		double o = 1.28;
		double p = i - o;
		System.out.println(p);
		System.out.println(round(p,2));
		double telFare = p;
		DecimalFormat df = new DecimalFormat("0.00");
		telFare = Double.parseDouble(df.format(telFare));
		System.out.println(telFare);*/
		
//		System.out.println((int)11.55);
//		double numtotal = 100000;
//		double num1 = 0;
//		for(int i = 1 ;i<=10000;i++ ){
//			//double num1 = round(Math.random(), 2);
//			double num2 = round(Math.random(), 2);
//			double num = 0;
//			num = numtotal - num2;
//			num1 += num2;
//			numtotal = round(num,2);
/*//			if(num2 > num1){
*///				num = num1;
//				num1 = num2;
//				num2 = num;
//			}
//			double num3 = numtotal - num2;
//			if(String.valueOf(num3).length()>4){
//				System.out.println("num1=="+num1+"--------num2=="+num2+"--------num3=="+num3);
//			}
		}
//		System.out.println(numtotal);
//		System.out.println(num1);
//	}

}
