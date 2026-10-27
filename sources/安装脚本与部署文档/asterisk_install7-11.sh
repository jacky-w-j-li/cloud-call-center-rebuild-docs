#!/bin/sh
# install asterisk software
# Usage: ./asterisk_install.sh  pbx
#
#install package is pbx.tar.gz

# Variable definition
package=/tools/pbx
log=/var/log
yun=$1               ## btg or pbx
mkdir -p  $package

##Wait message
#function wait_message(){
#    
#tr()
# {
#sl='sleep 1'
#while true
#do
#     echo -e '***'"\b\b\b\c";$sl
#     echo -e '###'"\b\b\b\c";$sl
#     echo -e '@@@'"\b\b\b\c";$sl
#done
#}
#tr $1 &
#TR_PID=$!
#$1 >/dev/null
#kill -9 $TR_PID
#}

# Error message
function err_exit {
     echo
     echo
     echo -e  "\e[31m -----Install Error : $1--------- "
     echo  -e "detailed information please see $log \e[0m"
     echo
     exit
}

if [ $# != "1" ];then
     printf "\nwrite like this :     ./asterisk_install.sh pbx\n               ./asterisk_install.sh btg\n\n"
     exit
else
     if [ $1 != "pbx" ] && [ $1 != "btg" ];then
          printf "\nwrite like this :     ./asterisk_install.sh pbx\n               ./asterisk_install.sh btg\n\n"
          exit
     fi
fi

[ -d  $log ] || mkdir $log

echo -e "\e[32m Start Extract The File \e[0m "

[ -f pbx.tar.gz ] || echo -e "\e[32m Not found the pbx.tar.gz to install\e[0m"
[ -f pbx.tar.gz ] || exit  1
\mv pbx.tar.gz /tools/
cd /tools
/bin/tar xf  pbx.tar.gz
sleep 8
#                    install package
cd $package
echo -e "\e[32mStart Install The Speex \e[0m "
tar xf speex-1.2rc1.tar.gz && cd speex-1.2rc1 && ./configure > $log/speex.log && make >> $log/speex.log && make install >> $log/speex.log && cd ..
[ $? != 0 ] && err_exit -e  "\e[31m speex install is error\e[0m"
printf  "\n\e[32m -----speed install is done-----\n\e[0m "

yum -y install jansson jansson-devel
#                    ldconfig
ln -s -f /usr/local/lib/libspeexdsp.so /usr/lib/      > $log/ldconfig.log
ln -s -f /usr/local/lib/libspeexdsp.so.1 /usr/lib/  >> $log/ldconfig.log
ln -s -f /usr/local/lib/libspeex.so /usr/lib/          >> $log/ldconfig.log
ln -s -f /usr/local/lib/libspeex.so.1 /usr/lib/      >> $log/ldconfig.log
ln -s /usr/local/lib/*.so /usr/lib
ln -s /usr/local/lib/*.so.4 /usr/lib
ln -s /usr/local/lib/*.so.1 /usr/lib     >> $log/ldconfig.log
ldconfig
ldconfig -v >> $log/ldconfig.log
#yum -y install libtool* sqlite-devel gcc libsysfs libsrtp   libsrtp-devel libtsan uuid-devel libuuid libuuid-devel
yum -y install libtool* sqlite-devel gcc libsysfs libsrtp libtsan libuuid-devel libuuid libuuid-devel

[ $? != 0 ] && err_exit "\e[31m ldconfig is error[0m"
printf "\n\e[32m -----ldconfig is ok-----\e[0m\n"

#               Install Pbx
if [ $yun == "pbx" ];then
     echo -e "\e[32mStart Install The dahdi-linux\e[0m"
     tar xzvf dahdi-linux-complete-current.tar.gz > $log/dahdi-linux.log && cd dahdi-linux-complete-3.2.0+3.2.0  && make >> $log/dahdi-linux.log && make install >> $log/dahdi-linux.log && make install-config >> $log/dahdi-linux.log&& cd ..  
     [ $? != 0 ] && err_exit "\e[31mdahdi-linux install is error\e[0m"
     printf "\n\e[32m-----dahdi-linux install is done-----\n\e[0m"
     
     # rename dahdi.conf  and restart dahdi
     cp /etc/dahdi/assigned-spans.conf.sample /etc/dahdi/assigned-spans.conf
     cp /etc/dahdi/system.conf.sample /etc/dahdi/system.conf
     ldconfig
     modprobe dahdi
     systemctl enable  dahdi
     systemctl start dahdi
     [ $? != 0 ] && err_exit "\e[31m dahdi restart is error\e[0m"

     printf "\n\e[32m-----dahdi restrat is done-----\n\e[0m"
#               Install Btg
elif [ $yun == "btg" ];then
     echo -e "\e[32mStart Install The libpri\e[0m"
     tar xf libpri-1.4.12.tar.gz && cd libpri-1.4.12 && make clean > $log/libpri.log && make >> $log/libpri.log && make install >> $log/libpri.log && cd ..
     [ $? != 0 ] && err_exit "libpri install is error"
     printf "\n\e[32m-----libpri install is done-----\e[0m\n"
     echo -e "\e[32mStart Install The openvox_dahdi-linux-complete\e[0m"
     tar xf openvox_dahdi-linux-complete-2.6.1+2.6.1.tar.gz && cd dahdi-linux-complete-2.6.1+2.6.1 && make clean > $log/openvox_dahdi.log && make >> $log/openvox_dahdi.log && make install >> $log/openvox_dahdi.log && make config >> $log/openvox_dahdi.log && cd ..
     [ $? != 0 ] && err_exit "openvox dahdi install is error"
     printf "\n\e[32m-----openvox_dahdi install is done-----\e[0m\n"
     mv /etc/modprobe.d/dahdi /etc/modprobe.d/dahdi.conf > $log/dahdi-restart.log && mv /etc/modprobe.d/dahdi.blacklist /etc/modprobe.d/dahdi.blacklist.conf >> $log/dahdi-restart.log
     /etc/init.d/dahdi restart >> $log/dahdi-restart.log && dahdi_genconf >> $log/dahdi-restart.log && dahdi_cfg -vvvvv >> $log/dahdi-restart.log
     sed -i "s/hdb3,crc4/hdb3/g" /etc/dahdi/system.conf
     sed -i "s/echocanceller/#echocanceller/g" /etc/dahdi/system.conf
     /etc/init.d/dahdi restart >> $log/dahdi-restart.log
     [ $? != 0 ] && err_exit "dahdi restart is error"
        printf "\n\e[32m-----dahdi restrat is done-----\e[0m\n"
fi


echo -e "\e[32m Start Install asterisk \e[0m"
tar xf asterisk-1.4.44.tar.gz && cd asterisk-1.4.44/  && make clean && ./configure CFLAGS=-std=gnu89 > $log/asterisk.log
[ $? != 0 ] && err_exit "\e[31m asterisk configure is error\e[0m"

\cp -fr $package/menuselect.makeopts  $package/asterisk-1.4.44/

echo -e "s" | make menuselect
[ $? != 0 ] && err_exit "\e[31m asterisk make menuselect is error\e[0m"
sleep 5
printf "\n\e[32m-----asterisk make menuselect is ok-----\n\e[0m" >> $log/asterisk.log
ASTCFLAGS="-std=gnu89" make > $log/asterisk.log && make install >> $log/asterisk.log && cd ..
[ $? != 0 ] && err_exit "\e[31m asterisk make and install is error\e[0m"
printf "\n\e[32m-----asterisk install is done-----\n\e[0m"

ln -s /usr/lib64/libjansson.so /usr/lib/asterisk/modules/libjansson.so 

tar xf sox-14.0.0.tar.gz && cd sox-14.0.0 && ./configure > $log/sox.log && make >> $log/sox.log && make install >> $log/sox.log && cd ..
[ $? != 0 ] && err_exit "\e[31msox install is error\e[0m"
printf "\n\e[32m-----sox install is done-----\n\e[0m"

tar xf lame-3.98.4.tar.gz && cd lame-3.98.4 && ./configure > $log/lame.log && make >> $log/lame.log && make install >> $log/lame.log && cd ..
[ $? != 0 ] && err_exit "\e[31m lame install is error\e[0m"
printf "\n\e[32m-----lame install is done-----\n\e[0m"

/bin/cp $package/codec_g729-ast14-gcc4-glibc-x86_64-pentium4.so /usr/lib/asterisk/modules/ > $log/codec_g729.log
[ $? != 0 ] && err_exit "\e[31m g729 install is error\e[0m"
printf "\n\e[32m-----g729 install is done-----\n\e[0m"

/bin/rm  -rf /var/lib/asterisk/moh/* && /bin/rm -rf /var/lib/asterisk/sounds/*
unzip sounds.zip > $log/sounds.log && cd $package/sounds && unzip digits.zip >> $log/sounds.log && unzip sound.zip >> $log/sounds.log && rm -f digits.zip sound.zip && cd .. && /bin/cp -r $package/sounds/* /var/lib/asterisk/sounds/
[ $? != 0 ] && err_exit "\e[31m sound install is error\e[0m"
printf "\n\e[32m-----sounds is ok-----\n\e[0m"

tar xf moh.tar.gz && /bin/cp /tools/pbx/moh/youmi.wav  /var/lib/asterisk/moh/
[ $? != 0 ] && err_exit "\e[31m moh install is error\e[0m"
printf "\n\e[32m-----moh is ok-----\n\e[0m"

groupadd -r nginx && useradd -s /sbin/nologin  -g nginx -r nginx && mkdir -p /data/nginx && chown -R nginx:nginx /data/nginx && tar xf ngx_cache_purge-2.1.tar.gz && tar xf nginx-1.18.0.tar.gz && cd nginx-1.18.0 &&./configure --user=nginx --group=nginx --prefix=/opt/nginx --with-http_stub_status_module --with-http_ssl_module --with-http_realip_module --with-http_addition_module --without-http_rewrite_module --with-stream=dynamic >> $log/nginx.log
sleep 3
make >> $log/nginx.log && make install >> $log/nginx.log
[ $? != 0 ] && err_exit "\e[31m nginx install is error\e[0m"
printf "\n\e[32m-----nginx is ok-----\n\e[0m"


echo -e "\e[32m asterisk is ok\e[0m"
echo -e "\e[32m if you want to config asterisk,please run the config.sh \e[0m"
