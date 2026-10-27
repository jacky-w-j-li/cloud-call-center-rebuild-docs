package com.m7.cc.ass.config.model;

import com.m7.cc.util.Utils;

public class Province {
	private String code;
	private String name;

	public Province(String code, String name) {
		this.code = code;
		this.name = Utils.toUnicode(name);
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
}
