package com.m7.cc.ass.config.model;

import com.m7.cc.util.Utils;

public class District {
	private String code;
	private String name;
	private String provinceCode;

	public District(String code, String name, String provinceCode) {
		this.code = code;
		this.name = Utils.toUnicode(name);
		this.provinceCode = provinceCode;
	}

	public String getCode() {
		return code;
	}

	public void setCode(String code) {
		this.code = code;
	}

	public String getName() {
		return name;
	}

	public void setName(String name) {
		this.name = Utils.toUnicode(name);
	}

	public String getProvinceCode() {
		return provinceCode;
	}

	public void setProvinceCode(String provinceCode) {
		this.provinceCode = provinceCode;
	}

}
