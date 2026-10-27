/*
 * @(#)HttpError.java	1.3 05/11/17
 *
 * Copyright 2006 Sun Microsystems, Inc. All rights reserved.
 * SUN PROPRIETARY/CONFIDENTIAL. Use is subject to license terms.
 */

package cc.net.httpserver;

/**
 * A Http error
 */
class HttpError extends RuntimeException {
    public HttpError (String msg) {
	super (msg);
    }
}
