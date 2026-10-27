package com.m7.cc.ass.osgi.service;

import java.io.File;
import java.io.FileFilter;
import java.io.FileInputStream;

import org.osgi.framework.Bundle;
import org.osgi.framework.BundleActivator;
import org.osgi.framework.BundleContext;
import org.osgi.framework.BundleEvent;
import org.osgi.framework.BundleException;

/**
 * Via this class all actions of osgi framework could be done.
 * 
 * @author Cai Zhibin
 *
 */
public class BundleManager {
	
	private static BundleManager instance;
	
	private BundleContext context;
	
	public BundleManager(BundleContext context){
		instance = this;
		this.context = context;
	}
	
	public static BundleManager getInstance(){
		return instance;
	}
	
	public Bundle[] getBundles() throws Exception {
		return context.getBundles();
	}
	
	public void startBundle(long id) throws Exception {
		Bundle bundle = context.getBundle(id);
		if(bundle == null){
			throw new Exception("Bundle ["+id+"] not found");
		}
		bundle.start();
	}
	
	public void stopBundle(long id) throws Exception {
		Bundle bundle = context.getBundle(id);
		if(bundle == null){
			throw new Exception("Bundle ["+id+"] not found");
		}
		bundle.stop();
	}
	
	/**
	 * Stops this bundle.
	 * 
	 * <p>
	 * The following steps are required to stop a bundle:
	 * <ol>
	 * <li>If this bundle's state is <code>UNINSTALLED</code> then an
	 * <code>IllegalStateException</code> is thrown.
	 * 
	 * <li>If this bundle is in the process of being activated or deactivated
	 * then this method must wait for activation or deactivation to complete
	 * before continuing. If this does not occur in a reasonable time, a
	 * <code>BundleException</code> is thrown to indicate this bundle was unable
	 * to be stopped.
	 * <li>If the {@link #STOP_TRANSIENT} option is not set then then set this
	 * bundle's persistent autostart setting to to <em>Stopped</em>. When the
	 * Framework is restarted and this bundle's autostart setting is
	 * <em>Stopped</em>, this bundle must not be automatically started.
	 * 
	 * <li>If this bundle's state is not <code>STARTING</code> or
	 * <code>ACTIVE</code> then this method returns immediately.
	 * 
	 * <li>This bundle's state is set to <code>STOPPING</code>.
	 * 
	 * <li>A bundle event of type {@link BundleEvent#STOPPING} is fired.
	 * 
	 * <li>If this bundle's state was <code>ACTIVE</code> prior to setting the
	 * state to <code>STOPPING</code>, the {@link BundleActivator#stop} method
	 * of this bundle's <code>BundleActivator</code>, if one is specified, is
	 * called. If that method throws an exception, this method must continue to
	 * stop this bundle and a <code>BundleException</code> must be thrown after
	 * completion of the remaining steps.
	 * 
	 * <li>Any services registered by this bundle must be unregistered.
	 * <li>Any services used by this bundle must be released.
	 * <li>Any listeners registered by this bundle must be removed.
	 * 
	 * <li>If this bundle's state is <code>UNINSTALLED</code>, because this
	 * bundle was uninstalled while the <code>BundleActivator.stop</code> method
	 * was running, a <code>BundleException</code> must be thrown.
	 * 
	 * <li>This bundle's state is set to <code>RESOLVED</code>.
	 * 
	 * <li>A bundle event of type {@link BundleEvent#STOPPED} is fired.
	 * </ol>
	 * 
	 * <b>Preconditions </b>
	 * <ul>
	 * <li><code>getState()</code> in &#x007B; <code>ACTIVE</code> &#x007D;.
	 * </ul>
	 * <b>Postconditions, no exceptions thrown </b>
	 * <ul>
	 * <li>Bundle autostart setting is modified unless the
	 * {@link #STOP_TRANSIENT} option was set.
	 * <li><code>getState()</code> not in &#x007B; <code>ACTIVE</code>,
	 * <code>STOPPING</code> &#x007D;.
	 * <li><code>BundleActivator.stop</code> has been called and did not throw
	 * an exception.
	 * </ul>
	 * <b>Postconditions, when an exception is thrown </b>
	 * <ul>
	 * <li>Bundle autostart setting is modified unless the
	 * {@link #STOP_TRANSIENT} option was set.
	 * </ul>
	 * 
	 * @param options The options for stoping this bundle. See
	 *        {@link #STOP_TRANSIENT}. The Framework must ignore unrecognized
	 *        options.
	 * @throws BundleException If this bundle's <code>BundleActivator</code>
	 *         threw an exception or this bundle is a fragment.
	 * @throws IllegalStateException If this bundle has been uninstalled or this
	 *         bundle tries to change its own state.
	 * @throws SecurityException If the caller does not have the appropriate
	 *         <code>AdminPermission[this,EXECUTE]</code>, and the Java Runtime
	 *         Environment supports permissions.
	 * @since 1.4
	 */
	public void stopBundle(long id, int options) throws Exception {
		Bundle bundle = context.getBundle(id);
		if(bundle == null){
			throw new Exception("Bundle ["+id+"] not found");
		}
		bundle.stop();
	}
	
	public void updateBundle(long id) throws Exception {
		Bundle bundle = context.getBundle(id);
		if(bundle == null){
			throw new Exception("Bundle ["+id+"] not found");
		}
		String jar = getLateastBunleFile(bundle.getSymbolicName());
		if(jar != null){
			bundle.update(new FileInputStream("./plugins/"+jar));
		}
	}
	
	public void installBundle() throws Exception {
//		context.installBundle(arg0)
	}
	
	public void uninstallBunle(long id) throws Exception {
		Bundle bundle = context.getBundle(id);
		if(bundle == null){
			throw new Exception("Bundle ["+id+"] not found");
		}
		bundle.uninstall();
	}
	
	private String getLateastBunleFile(final String name){
		File file = new File("./plugins");
		FileFilter filter = new FileFilter(){

			@Override
			public boolean accept(File a) {
				if(a.getName().startsWith(name+"_") && a.getName().endsWith(".jar")){
					return true;
				}
				return false;
			}
			
		};
		File[] files = file.listFiles(filter);
		String version = null;
		if(files != null && files.length > 0) {
			version = files[0].getName().substring(name.length()+1, files[0].getName().length()-4);
			long[] vlong = this.getVesionLongValue(version);
			for (int i=1;i<files.length;i++){
				String next = files[i].getName().substring(name.length()+1, files[i].getName().length()-4);
				long[] nextv = this.getVesionLongValue(next);
				for(int j=0;j<nextv.length;j++){
					if(nextv[j] < vlong[j])
						break;
					if(nextv[j] == vlong[j])
						continue;
					if(nextv[j] > vlong[j]){
						vlong = nextv;
						version = next;
						break;
					}
				}
			}
		}
		if(version == null)
			return null;
		else return name+"_"+version+".jar";
	}
	
	private long[] getVesionLongValue(String version){
		String[] s = version.split("\\.");
		long[] ver = new long[s.length];
		for(int i=0;i<s.length;i++){
			ver[i] = Long.valueOf(s[i]);
		}
		return ver;
	}

}
