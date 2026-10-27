#!/bin/bash
# created by hansz

# for aliyun partition 
# partition 
function partition(){  

#Disk_dev=`fdisk -l | grep "Disk /dev/" | grep  -vE "^Disk.*/.*/.*/.*" | awk '{print $2}' | awk -F":" '{print $1}' | tail -n 1`
Disk_dev=`fdisk -l | grep -o "^Disk /dev/[shvx][dvd][a-z]" | sort -d | awk '{print $2}' | awk -F":" '{print $1}' | tail -n 1`
Disk_dev1=$Disk_dev"1"
       #      partition
fdisk -l $Disk_dev | grep "Disk $Disk_dev"  >/dev/null
if [[ $? -eq 0 ]];then
    fdisk -l $Disk_dev1 | grep "Disk $Disk_dev1" >/dev/null
        if [[ $? -ne 0 ]];then
              echo "Start partition ..."
              fdisk -S 56 $Disk_dev << ESXU
n
p
1


w
ESXU
              echo -e "\e[31m Disk Partition is ok \e[0m"
              mkfs.ext4 $Disk_dev1
              if [ $Server_Type == "pbx" ];then  
                  mount $Disk_dev1 /mnt
                  cp -aR /var/* /mnt/
                  echo "$Disk_dev1  /var ext4    defaults    0  0" >> /etc/fstab
              elif [ $Server_Type == "dev" ];then
                  mkdir /data
                  echo "$Disk_dev1  /data ext4    defaults    0  0" >> /etc/fstab
              fi
              mount -a
        else
              echo -e "\e[32m Disk had partition \e[0m"
        fi
else
    echo -e "\e[32m Not found new disk to mount \e[0m"
fi
}



function install_comm(){
# install software
echo -e '\e[32m Start install software \e[0m'
#yum install -y  kernel-devel tree ftp sysstat nc perl-libxml-perl dos2unix ipmitool  minicom lrzsz iotop telnet ant binutils compat-libstdc++-33 elfutils-libelf elfutils-libelf-devel gcc gcc-c++ glibc glibc-common glibc-devel glibc-headers libaio  libaio-devel libgcc libstdc++ libstdc++-devel make sysstat unixODBC unixODBC-devel libXp gcc bison openssl-devel rpm-build speex ncurses-devel net-snmp net-snmp-devel net-snmp-libs net-snmp-utils openssl098e crypto-utils libcurl-devel libcmpiCppImpl0 libwsman1 libss openwsman-client sblim-sfcc sblim-sfcb openwsman-server ntp lsb libgnomeui-devel
#yum install -y tree ftp sysstat nc perl-libxml-perl dos2unix ipmitool  minicom lrzsz iotop telnet ant binutils compat-libstdc++-33 elfutils-libelf elfutils-libelf-devel gcc gcc-c++ glibc glibc-common glibc-devel glibc-headers libaio  libaio-devel libgcc libstdc++ libstdc++-devel make sysstat unixODBC unixODBC-devel libXp gcc bison openssl-devel rpm-build speex ncurses-devel net-snmp net-snmp-devel net-snmp-libs net-snmp-utils openssl098e crypto-utils libcurl-devel libcmpiCppImpl0 libwsman1 libss openwsman-client sblim-sfcc sblim-sfcb openwsman-server ntp lsb libgnomeui-devel

yum install -y tree ftp sysstat nc perl-libxml-perl dos2unix ipmitool  minicom lrzsz iotop telnet ant binutils elfutils-libelf elfutils-libelf-devel gcc gcc-c++ glibc glibc-common glibc-devel glibc-headers libaio  libaio-devel libgcc libstdc++ libstdc++-devel make sysstat unixODBC unixODBC-devel libXp gcc bison openssl-devel rpm-build speex ncurses-devel net-snmp net-snmp-devel net-snmp-libs net-snmp-utils libcurl-devel libcmpiCppImpl0 libwsman1 libss openwsman-client sblim-sfcc sblim-sfcb openwsman-server lsb

yum install -y libogg-devel libnsl

#             chkconfig some server
#ntpdate time1.aliyun.com

#             disable selinux
sleep 1

#             file limits
echo  "* soft nofile 65000" >> /etc/security/limits.conf      
echo  "* hard nofile 65535" >> /etc/security/limits.conf      
echo "ulimit -n 65535"      >> /etc/rc.local
sleep  1
#             check fstab
#sed -i 's/[0-9]$/0/g' /etc/fstab
chmod 755 /etc/rc.d/rc.local
#             firewall
#chkconfig --level 35 iptables off ;/etc/init.d/iptables stop

#             snmp
#sed -i 's/com2sec notConfigUser  default       public/com2sec notConfigUser  127.0.0.1       public/g' /etc/snmp/snmpd.conf  
#sed -i 's/^access  notConfigGroup ""      any       noauth    exact/access  notConfigGroup ""      any       noauth    exact  mib2  none  none/g' /etc/snmp/snmpd.conf 
#sed -i 's/\#view mib2   included  .iso.org.dod.internet.mgmt.mib-2 fc/view mib2   included  .iso.org.dod.internet.mgmt.mib-2 fc/' /etc/snmp/snmpd.conf   
#sed -i 's/OPTIONS="-LS0-6d -Lf \/dev\/null -p \/var\/run\/snmpd.pid"/OPTIONS="-LS 4 d -p \/var\/run\/snmpd.pid -a"/g' /etc/init.d/snmpd    

}

function user_group(){
#             useadd groupadd
echo -e "\e[32m set user and group \[0m"
groupadd -g 801 sa       
useradd -g sa -u 820 zhangdw
useradd -g sa -u 825 baolei


#             sudo file      
echo "zhangdw  ALL=(ALL)     NOPASSWD: ALL">>/etc/sudoers
echo "baolei   ALL=(ALL)     NOPASSWD: ALL">>/etc/sudoers


#             set passwd for user 
echo  "uckPnGExozjrhOeHpMKmpFQOLak="|passwd zhangdw --stdin
echo  "lkyaykHWHl866C/5SI8+1kDXK6Q=" |passwd baolei  --stdin

}

function ssh_config(){
#             set sshd file
echo " " >> /etc/ssh/sshd_config
echo "#Custom " >> /etc/ssh/sshd_config
echo "Port 65022">>/etc/ssh/sshd_config  

echo "PermitRootLogin no">>/etc/ssh/sshd_config 
sed -i '/PermitRootLogin yes/d' /etc/ssh/sshd_config
echo "UseDNS no">>/etc/ssh/sshd_config   
echo "ClientAliveInterval  3600" >> /etc/ssh/sshd_config      
chkconfig --level 35 iptables off ;/etc/init.d/iptables stop  


}



function jdk_install(){
#             install jdk 
echo -e '\e[32m install jdk ..\e[0m'
[ -d  /tools ] || mkdir /tools
tar -zxvf tools.tar.gz -C /tools
cd /tools
chmod +x jdk-6u24-linux-x64.bin
./jdk-6u24-linux-x64.bin
mv jdk1.6.0_24/     /opt/java

tar xf jdk-8u77-linux-x64.tar.gz -C /opt

cat >>/etc/profile << CRM
## add env for java installment by wangxb
JAVA_HOME=/opt/jdk1.8.0_77
JRE_HOME=\$JAVA_HOME/jre
CLASSPATH=:\$JAVA_HOME/lib:\$JRE_HOME/lib
PATH=\$JAVA_HOME/bin:$PATH
export JAVA_HOME JRE_HOME CLASSPATH PATH
export HISTTIMEFORMAT="%Y-%m-%d_%H:%M:%S `whoami` "
CRM
source /etc/profile
sleep 2
java -version
sleep 2
}

function nagios_install(){
#             install  nagios
echo -e "\e[32m Install Nagios ...\e[0m"
Sys_Version=`lsb_release -r | awk '{print $2}'`
/usr/sbin/adduser nagios -M -s /sbin/nologin -u 1081
cd /tools/
unzip nagios.zip
cd nagios/
tar zxf nagios-plugins-1.4.16.tar.gz && cd nagios-plugins-1.4.16 && ./configure --with-nagios-user=nagios --with-nagios-group=nagios --enable-perl-modules && make && make install && cd ../
if [[ $? != 0 ]] || [[ "$Sys_Version" > "7" ]]; then
		sed -i '/gets is a security/d' /tools/nagios/nagios-plugins-1.4.16/gl/stdio.in.h && cd /tools/nagios/nagios-plugins-1.4.16
		make && make install && cd ../
		if [[ $? != 0 ]]; then
        		cd /tools/nagios/nagios-plugins-1.4.16/perlmods/Params-Validate-0.88 && perl Makefile.PL --pm && cd /tools/nagios/nagios-plugins-1.4.16
        		make && make install && cd ../
    	fi
fi
tar zxvf nrpe-2.12.tar.gz && cd nrpe-2.12 && ./configure && make all && make install-plugin && make install-daemon && make install-daemon-config && cd ..
tar zxvf Params-Validate-0.91.tar.gz && cd Params-Validate-0.91 && perl Makefile.PL && make && make install && cd ..
tar zxvf Class-Accessor-0.31.tar.gz && cd Class-Accessor-0.31 && perl Makefile.PL && make && make install && cd ..
tar zxvf Config-Tiny-2.12.tar.gz && cd Config-Tiny-2.12 && perl Makefile.PL && make && make install && cd ..
tar zxvf Math-Calc-Units-1.07.tar.gz && cd Math-Calc-Units-1.07 && perl Makefile.PL && make && make install && cd ..
tar zxvf Regexp-Common-2010010201.tar.gz && cd Regexp-Common-2010010201 && perl Makefile.PL && make && make install && cd ..
tar zxvf Nagios-Plugin-0.34.tar.gz && cd Nagios-Plugin-0.34 && perl Makefile.PL && make && make install && cd ..
cd /tools/nagios
cp check_sipproxy_num check_asterisk_rtp check_memory.pl check_iostat check_file_des check_netstat check_traffic.sh check_call  check_messages.sh  check_mem check_mem7 check_nginx /usr/local/nagios/libexec
chmod 755 /usr/local/nagios/libexec/*
chown nagios.nagios /usr/local/nagios/libexec/* -R 
dos2unix /usr/local/nagios/libexec/check_memory.pl
dos2unix /usr/local/nagios/libexec/check_iostat
mkdir -p /var/tmp/nagios && chown -R nagios.nagios /var/tmp/nagios
sed -i 's/allowed_hosts=127.0.0.1/allowed_hosts=120.55.115.110,47.97.50.237/g' /usr/local/nagios/etc/nrpe.cfg
sed -i '199,203d' /usr/local/nagios/etc/nrpe.cfg      
}


function nrpe_config(){
cat >> /usr/local/nagios/etc/nrpe.cfg << CRM
command[check_load]=/usr/local/nagios/libexec/check_load -w 9,7,5 -c 9,7,5
command[check_mem]=/usr/local/nagios/libexec/check_mem 80 90
command[check_disk_/]=/usr/local/nagios/libexec/check_disk -W 50% -w 20% -c 10% -E /
command[check_disk_/var]=/usr/local/nagios/libexec/check_disk -W 50% -w 20% -c 10% -E /var
command[check_disk_/var/spool/asterisk]=/usr/local/nagios/libexec/check_disk -W 50% -w 20% -c 10% -E /var/spool/asterisk
command[check_disk_/data]=/usr/local/nagios/libexec/check_disk -W 50% -w 20% -c 10% -E /data 
command[check_disk_/data2]=/usr/local/nagios/libexec/check_disk -W 50% -w 20% -c 10% -E /data2
command[check_disk_/dev/shm]=/usr/local/nagios/libexec/check_disk -W 50% -w 75% -c 50% -E /dev/shm
command[check_swap]=/usr/local/nagios/libexec/check_swap  -w 60% -c 60%
command[check_iostat]=/usr/local/nagios/libexec/check_iostat -w 6 -c 10
command[check_users]=/usr/local/nagios/libexec/check_users -w 8 -c 10
command[check_procs]=/usr/local/nagios/libexec/check_procs -w 600
command[check_file_des]=/usr/local/nagios/libexec/check_file_des -c 20000
command[check_net_num]=/usr/local/nagios/libexec/check_netstat -c 30000
command[check_traffic-p3p1]=/usr/local/nagios/libexec/check_traffic.sh -V 2c -C public -H 127.0.0.1 -I `ip add |grep ": p3p1:"|cut -d: -f1` -w 10000,20000 -c 20000,30000 -M -b
command[check_traffic-p3p2]=/usr/local/nagios/libexec/check_traffic.sh -V 2c -C public -H 127.0.0.1 -I `ip add |grep ": p3p2:"|cut -d: -f1` -w 10000,20000 -c 20000,30000 -M -b
command[check_traffic-p4p1]=/usr/local/nagios/libexec/check_traffic.sh -V 2c -C public -H 127.0.0.1 -I `ip add |grep ": p4p1:"|cut -d: -f1` -w 10000,20000 -c 20000,30000 -M -b
command[check_traffic-p4p2]=/usr/local/nagios/libexec/check_traffic.sh -V 2c -C public -H 127.0.0.1 -I `ip add |grep ": p4p2:"|cut -d: -f1` -w 10000,20000 -c 20000,30000 -M -b
command[check_traffic-em1]=/usr/local/nagios/libexec/check_traffic.sh -V 2c -C public -H 127.0.0.1 -I `ip add |grep ": em1:"|cut -d: -f1` -w 10000,20000 -c 20000,30000 -M -b
command[check_traffic-bond0]=/usr/local/nagios/libexec/check_traffic.sh -V 2c -C public -H 127.0.0.1 -I `ip add |grep ": bond0:"|cut -d: -f1` -w 10000,20000 -c 20000,30000 -M -b
command[check_traffic-bond1]=/usr/local/nagios/libexec/check_traffic.sh -V 2c -C public -H 127.0.0.1 -I `ip add |grep ": bond1:"|cut -d: -f1` -w 10000,20000 -c 20000,30000 -M -b
command[check_traffic-eth1]=/usr/local/nagios/libexec/check_traffic.sh -V 2c -C public -H 127.0.0.1 -I `ip add |grep ": eth1:"|cut -d: -f1` -w 10000,20000 -c 20000,30000 -M -b
command[check_sipproxy]=/usr/local/nagios/libexec/check_sipproxy_num -c 11
command[check_ASS]=/usr/local/nagios/libexec/check_http -H 127.0.0.1 -c 10
command[check_asteriskGuard]=/usr/local/nagios/libexec/check_log -F /var/log/asteriskGuard/monitor_0_0.log -O /var/log/asteriskGuard/monitor_0_0.log.old -q error
command[check_asterisk_rtp]=/usr/local/nagios/libexec/check_asterisk_rtp
command[check_call]=sudo /usr/local/nagios/libexec/check_call
command[check_messages]=/usr/local/nagios/libexec/check_messages.sh
command[check_nginx]=sudo /usr/local/nagios/libexec/check_nginx

CRM
#echo "*/5 * * * * root /usr/sbin/lsof -n |wc -l > /usr/local/nagios/libexec/file_des" >>/etc/crontab
echo "/etc/init.d/nrpe start" >> /etc/rc.local
cat > /etc/init.d/nrpe << CRM
#!/bin/bash
#20120406
case \${1} in
start)
       /usr/local/nagios/bin/nrpe -c /usr/local/nagios/etc/nrpe.cfg -d
       echo  " Start nrpe     [ok] "
;;
stop)
       kill -9 \`cat /var/run/nrpe.pid\`
       echo  " Stop nrpe     [ok] "
;;
restart)
       \${0} stop && \${0} start
       echo  " Restart nrpe     [ok] "
;;
*)
       echo  "Usage: \${0} {start|stop|restart}"
;;
esac
CRM
chmod 755 /etc/init.d/nrpe

}


function others_install(){
#            install iftop
rpm -ivh /tools/iftop-1.0-0.1.pre2.el6.x86_64.rpm
if [ $Server_Type == "pbx" ];then
  return 
else
	cd /tools
#PYVERSION=`python -V 2>&1 | cut -d ' ' -f 2 | sed 's/..$//'`
	PYVERSION=`python -V 2>&1 | cut -d ' ' -f 2  | sed  's/\.//g'`
#if [ ! -n "$PYVERSION" ] || [ $(echo "${PYVERSION} < 2.7" | bc) = 1 ];then
	if [ ! -n "$PYVERSION" ] || [ $PYVERSION -lt 279 ];then
       	xz -d Python-2.7.9.tar.xz  
       	tar xf Python-2.7.9.tar && cd Python-2.7.9 && ./configure --prefix=/usr/local && make --jobs=`cat /proc/cpuinfo | grep "processor" | wc -l` && make install && cd ../
       	cp -arf /usr/local/include/python2.7/* /usr/local/include/
       	if [ $? -eq 0 ];then
          	#sed -i "s/^#!\/usr\/bin\/python$/#!\/usr\/bin\/python.old/g" /usr/bin/yum
          	cd /usr/bin && mv python python.old &>/dev/null
          	sed -i 's/^#!\/usr\/bin\/python.*/#!\/usr\/bin\/python.old/g' /usr/bin/yum*
          	sed -i 's/^#!\/usr\/bin\/python.*/#!\/usr\/bin\/python.old/g' /usr/bin/firewall-cmd
          	sed -i 's/^#! \/usr\/bin\/python.*/#! \/usr\/bin\/python.old/g' /usr/libexec/urlgrabber-ext-down
          	sed -i 's/^#!\/usr\/bin\/python.*/#!\/usr\/bin\/python.old/g' /usr/bin/gnome-tweak-tool &> /dev/null
          	ln -s /usr/local/bin/python && cd /tools
       	fi
	fi
wget http://bootstrap.pypa.io/get-pip.py --no-check-cersed -i 's/^#! \/usr\/bin\/python.*/#! \/usr\/bin\/python.old/g' /usr/libexec/urlgrabber-ext-downtificate
python get-pip.py
exit 0
fi
}

function install_aliyun(){
install_comm
}

function install_physical(){
install_comm
}

function install_VMware(){
install_comm
}

function install_OpenStack(){
#partition
install_comm
#user_group
#ssh_config
jdk_install
#nagios_install
#nrpe_config
#others_install
}

export  LANG=en_US.UTF-8
Server_Type=$1
if [ $# != "1" ];then
     printf "write like this :$0 pbx\n                 $0 dev\n"
     exit
else
     if [ $1 != "pbx" ] && [ $1 != "dev" ];then
          printf "write like this :$0 pbx\n                 $0 dev\n"
          exit
     fi
fi

grep  "aliyun" /etc/motd >>/dev/null
if [ $? -eq 0 ];then
       echo "Your machine is aliyun Elastic Compute Service"
       install_aliyun
else
        grep  "Alibaba" /etc/motd >>/dev/null
        if [ $? -eq 0 ];then
                echo "Your machine is Alibaba Elastic Compute Service"
                install_aliyun
        else
                dmidecode -s system-product-name | grep "OpenStack" >> /dev/null
                if [ $? -eq 0 ];then
                        echo "Your machine is OpenStack Virtual machine"
                        install_OpenStack
                else 
                        echo "Your machine is  Physical machine "
                        install_physical
                fi
        fi
fi

