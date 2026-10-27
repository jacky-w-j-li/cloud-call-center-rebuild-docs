package com.m7.cc.ass.gateway.config.model;

import com.m7.cc.util.Utils;

public class RouteRuleCondition {
	public static final int PREFIX_MATCHED = 0;
	public static final int SUFFIX_MATCHED = 1;
	public static final int EQUAL_MATCHED = 2;
	
	private static final int DEFAULT_MATCHED = EQUAL_MATCHED;
	
	private String param;
	private int matchedType;
	private String value;
	
	public RouteRuleCondition()
	{
		this.param = null;
		this.matchedType = DEFAULT_MATCHED;
		this.value = null;
	}
	
	public RouteRuleCondition(String param, int matchedType, String value)
	{
		this.param = param;
		this.matchedType = matchedType;
		this.value = value;
	}
	
	public String getParam() {
		return param;
	}

	public void setParam(String param) {
		this.param = param;
	}

	public int getMatchedType() {
		return matchedType;
	}

	public void setMatchedType(int matchedType) {
		this.matchedType = matchedType;
	}

	public String getValue() {
		return value;
	}

	public void setValue(String value) {
		this.value = value;
	}
	
	public String getConditionString()
	{
		String a = "";
		
		if (null == this.param
				|| "".equals(this.param)
				|| null == this.value
				|| "".equals(this.value))
			return null;
	
		a += this.param + ":";
		a += this.matchedType + ":";
		a += this.value;
		
		return a;
	}
	
	private boolean isRightParam()
	{
		boolean result = true;
		
		if (null == this.param)
			return false;
		
		int i = 0;
		while (i < this.param.length())
		{
			char c = this.param.charAt(i);
			if (!Character.isLetterOrDigit(c)
					&& '_' != c || Character.isWhitespace(c))
			{
				result = false;
				break;
			}	
			i++;
		}
		
		return result;
	}
	
	private boolean isRightMatchedType()
	{
		boolean result = true;
	
		switch(this.matchedType)
		{
		case PREFIX_MATCHED:
			break;
		case SUFFIX_MATCHED:
			break;
		case EQUAL_MATCHED:
			break;
		default:
			result = false;
			break;
		}
		
		return result;
	}
	
	private boolean isRightValue()
	{
		boolean result = true;
		
		if (null == this.value)
			return false;
		
		int i = 0;
		while (i < this.value.length())
		{
			char c = this.value.charAt(i);
			if (!Character.isLetterOrDigit(c)
					&& ('_' != c && '-' != c)  || Character.isWhitespace(c))
			{
				result = false;
				break;
			}	
			i++;
		}
		
		return result;
	}
	
	public int parseStringToCondition(String strCondition)
	{
		int result = 0;
	
		if (null == strCondition)
			return -1;
		
		String []valuesGet = strCondition.split(":");
		
		if (null == valuesGet
				|| 3 != valuesGet.length
				|| !Utils.isNumeric(valuesGet[1]))
			return -1;
		
		this.param = valuesGet[0];
		this.matchedType = Integer.valueOf(valuesGet[1]);
		this.value = valuesGet[2];
		
		if (!isRightParam() || !isRightMatchedType() || !isRightValue())
			result = -1;
		
		return result;
	}
	
	public String getConditionMatchedString()
	{
		if (null == this.param
				|| "".equals(this.param)
				|| null == this.value
				|| "".equals(this.value)
				|| this.matchedType < 0)
			return null;

		String result = "";
		int lengthValue = 0;
		switch(matchedType)
		{
		case PREFIX_MATCHED:
			lengthValue = this.value.length();
			result += "\\$\\{" + this.param + ":0:"+ lengthValue + "\\}";
			result += " == ";
			result += this.value;
			break;
		case SUFFIX_MATCHED:
			lengthValue = this.value.length();
			result += "\\$\\{" + this.param + ":-"+ lengthValue + "\\}";
			result += " == ";
			result += this.value;
			break;
		case EQUAL_MATCHED:
			result += "\\$\\{" + this.param + "\\}";
			result += " == ";
			result += this.value;
			break;
		default:
			break;
		}
		
		return result;
	}
	
}
