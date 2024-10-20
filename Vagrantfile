Vagrant.configure("2") do |config|
  config.vm.hostname = "kubernetes-1.31"
  config.vm.box = "alvistack/kubernetes-1.31"
  config.vm.box_check_update = true

  config.vm.provider :virtualbox do |virtualbox, override|
    virtualbox.cpus = 2
    virtualbox.memory = 8192
    virtualbox.customize ["modifyvm", :id, "--cpu-profile", "host"]
    virtualbox.customize ["modifyvm", :id, "--nested-hw-virt", "on"]
    virtualbox.customize ["modifyvm", :id, "--nat-localhostreachable1", "on"]
    virtualbox.customize ["modifyvm", :id, "--graphicscontroller", "vboxsvga"]
    virtualbox.customize ["modifyvm", :id, "--accelerate3d", "off"]

    override.vm.disk :disk, name: "sdb", size: "10GB"
    override.vm.synced_folder "./", "/vagrant"
  end

  config.vm.provider :libvirt do |libvirt, override|
    libvirt.cpu_mode = "host-passthrough"
    libvirt.cpus = 2
    libvirt.disk_bus = "virtio"
    libvirt.disk_driver :cache => "writeback"
    libvirt.driver = "kvm"
    libvirt.memory = 8192
    libvirt.memorybacking :access, :mode => "shared"
    libvirt.nested = true
    libvirt.nic_model_type = "virtio"
    libvirt.video_type = "virtio"

    libvirt.storage :file, bus: "virtio", cache: "writeback"
    override.vm.synced_folder "./", "/vagrant", type: "virtiofs"
  end

  config.vm.network :forwarded_port, guest: 80, host: 8080

  config.vm.provision :shell, inline: <<-SHELL
    # stop auto kubernets provisioning
    systemctl stop guestfs-firstboot.service
    systemctl disable guestfs-firstboot.service

    # pre-fixup for path and permission
    chgrp -Rf www-data /vagrant
    chmod -Rf g+rw /vagrant
    chmod a-w /vagrant/sites/default /vagrant/sites/default/settings.php

    # manually provision kubernetes
    ansible-playbook \
      /etc/ansible/playbooks/verify.yml \
      /etc/ansible/playbooks/60-kube_cilium-install.yml \
      /etc/ansible/playbooks/70-kube_csi_hostpath-install.yml \
      /etc/ansible/playbooks/80-kube_ingress_nginx-install.yml \
      /etc/ansible/playbooks/70-kube_csi_hostpath-verify.yml

    # deploy resources
    until kubectl apply -Rf /etc/kubernetes/addons; do echo "sleep 10..."; sleep 10; done
    until kubectl apply -Rf /vagrant/sites/default/kubernetes; do echo "sleep 10..."; sleep 10; done

    # symlink csi-hostpath data folder for easy management
    pushd /var/lib/csi-hostpath && /vagrant/sites/default/csi-hostpath-symlink.sh && popd

    # hotfix for solr
    rsync -avP /vagrant/modules/contrib/search_api_solr/jump-start/solr9/config-set/ /var/lib/csi-hostpath/symlinks/default/opt-solr-server-solr-configsets-default-conf
    chown -Rf 8983:8983 $(readlink -f /var/lib/csi-hostpath/symlinks/default/var-solr-solr-0)
    kubectl -n default delete pod solr-0

    # wait until all pods running correctly
    until [ $(kubectl get pod --all-namespaces | grep -v Running | grep -v Completed | wc -l) -eq 1 ]; do echo "sleep 10..."; sleep 10; done
SHELL
end
