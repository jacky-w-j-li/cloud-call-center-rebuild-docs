package com.dishui.model;

/**
 * Created by zengyx on 16/10/9.
 */
public class NotificationVO {

    private String id;

    private String type;

    private double score;

    public double getScore() {
        return score;
    }

    public void setScore(double score) {
        this.score = score;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }
}
