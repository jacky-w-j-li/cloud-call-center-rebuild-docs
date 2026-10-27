package com.dishui.manager.report;

import com.dishui.manager.report.model.Event;

/**
 * Created by yaxi on 15-11-12.
 */
public interface EventListener {
    public void addToBuf(Event event);
}
