package com.m7.cc.ass.gateway.config.model;

public class AssignmentItem {
	private String param;
	private String value;
	
	public AssignmentItem()
	{
		this.param = null;
		this.value = null;
	}
	
	public AssignmentItem(String param, String value)
	{
		this.param = param;
		this.value = value;
	}
	
	private boolean isRightParam()
	{
		boolean result = true;
		
		if (null == this.param || "".equals(param))
			return false;
		
		int i = 0;
		while (i < this.param.length())
		{
			char c = this.param.charAt(i);
			if ((!Character.isLetterOrDigit(c)
					&& '_' != c) || Character.isWhitespace(c))
			{ 
				result = false;
				break;
			}
			i++;
		}
		
		
		return result;
	}
	
	private String getSubsetStringValue()
	{
		String result = "";
		
		if (null == this.value || "".equals(this.value))
			return "";
		
		int length = this.value.length();
		int i = 0;
		while (i < length)
		{
			if ('$' == this.value.charAt(i) 
					|| '{' == this.value.charAt(i)
					|| '}' == this.value.charAt(i))
			{
				result += "\\" + this.value.charAt(i);
			}
			else
			{
				result += this.value.charAt(i);
			}
				
			i++;
		}
		
		return result;
	}
	
	public String getItemString()
	{
		String a = "";
		
		if (!isRightParam()
				|| null == this.value
				|| "".equals(this.value))
			return null;
	
		a += "\t\t" + this.param + "=";
		a += getSubsetStringValue();
		a += ";\n";
		
		return a;
	}
	
	public String constructItemString()
	{
		String a = "";
		
		if (!isRightParam()
				|| null == this.value
				|| "".equals(this.value))
			return null;
	
		a += this.param + ":";
		a += this.value;
		
		return a;
	}
	
	public int parseStringToItem(String str)
	{
		int result = 0;
		
		if (null == str)
			return -1;

		String[] elements = str.split(":");

		if (null == elements || 2 != elements.length)
			return -1;

		this.param = elements[0];
		this.value = elements[1];
			
		return result;
	}
	
	
}
