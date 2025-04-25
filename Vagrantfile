Vagrant.configure("2") do |config|
  config.vm.hostname = "kubernetes-1.32"
  config.vm.box = "alvistack/kubernetes-1.32"
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
    override.vm.synced_folder "/tmp", "/tmp"
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
    override.vm.synced_folder "/tmp", "/tmp", type: "virtiofs"
  end

  config.vm.network :forwarded_port, guest: 80, host: 80

  config.vm.provision :shell, inline: <<-SHELL
    # stop auto kubernets provisioning
    systemctl stop guestfs-firstboot.service
    systemctl disable guestfs-firstboot.service

    # manually provision kubernetes
    ansible-playbook \
      /etc/ansible/playbooks/verify.yml \
      /etc/ansible/playbooks/60-cilium-install.yml \
      /etc/ansible/playbooks/60-helm_cilium-install.yml \
      /etc/ansible/playbooks/70-helm_csi_hostpath-install.yml \
      /etc/ansible/playbooks/80-helm_ingress_nginx-install.yml \
      /etc/ansible/playbooks/70-helm_csi_hostpath-verify.yml

    # deploy resources
    until kubectl apply -Rf /vagrant/sites/default/kubernetes; do echo "sleep 10..."; sleep 10; done

    # symlink csi-hostpath data folder for easy management
    rm -rf /var/lib/csi-hostpath/symlinks/default/*
    pushd /var/lib/csi-hostpath && /vagrant/sites/default/csi-hostpath-symlink.sh && popd
    rm -rf /var/lib/csi-hostpath/symlinks/default/var-www-html
    ln -fs /vagrant /var/lib/csi-hostpath/symlinks/default/var-www-html

    # wait until all pods running correctly
    until [ $(kubectl get pod --all-namespaces | grep -v Running | grep -v Completed | wc -l) -eq 1 ]; do echo "sleep 10..."; sleep 10; done
SHELL
end
