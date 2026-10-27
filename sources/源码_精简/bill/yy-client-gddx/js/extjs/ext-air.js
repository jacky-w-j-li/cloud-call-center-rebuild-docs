Ext.define('Ext.air.MusicPlayer', {
			extend : 'Ext.util.Observable',
			activeSound : null,
			activeChannel : null,
			activeTransform : new air.SoundTransform(1, 0),
			pausePosition : 0,
			progressInterval : 500,
			constructor : function(config) {
				config = config || {};
				Ext.apply(this, config);
				this.addEvents('stop', 'pause', 'play', 'load', 'id3info', 'complete', 'progress', 'skip');
				Ext.air.MusicPlayer.superclass.constructor.call(this, config);
				this.onSoundFinishedDelegate = this.onSoundFinished.createDelegate(this);
				this.onSoundLoadDelegate = this.onSoundLoad.createDelegate(this);
				this.onSoundID3LoadDelegate = this.onSoundID3Load.createDelegate(this);
				Ext.TaskMgr.start({
							run : this.notifyProgress,
							scope : this,
							interval : this.progressInterval
						});
			},
			adjustVolume : function(percent) {
				this.activeTransform.volume = percent;
				if (this.activeChannel) {
					this.activeChannel.soundTransform = this.activeTransform;
				}
			},
			stop : function() {
				this.pausePosition = 0;
				if (this.activeChannel) {
					this.activeChannel.stop();
					this.activeChannel = null;
				}
				if (this.activeSound) {
					this.activeSound.removeEventListener(air.Event.COMPLETE, this.onSoundLoadDelegate);
					this.activeSound.removeEventListener(air.Event.ID3, this.onSoundID3LoadDelegate);
					this.activeSound.removeEventListener(air.Event.SOUND_COMPLETE, this.onSoundFinishedDelegate);
				}
			},
			pause : function() {
				if (this.activeChannel) {
					this.pausePosition = this.activeChannel.position;
					this.activeChannel.stop();
				}
			},
			play : function(url) {
				if (url) {
					this.stop();
					var req = new air.URLRequest(url);
					this.activeSound = new air.Sound();
					this.activeSound.addEventListener(air.Event.SOUND_COMPLETE, this.onSoundFinishedDelegate);
					this.activeSound.addEventListener(air.Event.COMPLETE, this.onSoundLoadDelegate);
					this.activeSound.addEventListener(air.Event.ID3, this.onSoundID3LoadDelegate);
					this.activeSound.load(req);
				} else {
					this.onSoundLoad();
				}
			},
			skipTo : function(pos) {
				if (this.activeChannel) {
					this.activeChannel.stop();
					this.activeChannel = this.activeSound.play(pos);
					this.activeChannel.soundTransform = this.activeTransform;
					this.fireEvent('skip', this.activeChannel, this.activeSound, pos);
				}
			},
			hasActiveChannel : function() {
				return !!this.activeChannel;
			},
			onSoundLoad : function(event) {
				if (this.activeSound) {
					if (this.activeChannel) {
						this.activeChannel.stop();
					}
					this.activeChannel = this.activeSound.play(this.pausePosition);
					this.activeChannel.soundTransform = this.activeTransform;
					this.fireEvent('load', this.activeChannel, this.activeSound);
				}
			},
			onSoundFinished : function(event) {
				this.fireEvent('complete', event);
			},
			onSoundID3Load : function(event) {
				this.activeSound.removeEventListener(air.Event.ID3, this.onSoundID3LoadDelegate);
				var id3 = event.target.id3;
				this.fireEvent('id3info', id3);
			},
			notifyProgress : function() {
				if (this.activeChannel && this.activeSound) {
					var playbackPercent = 100 * (this.activeChannel.position / this.activeSound.length);
					if (playbackPercent > 99.7) {
						this.onSoundFinished();
					} else {
						this.fireEvent('progress', this.activeChannel, this.activeSound);
					}
				}
			}
		});
