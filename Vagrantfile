Vagrant.configure('2') do |config|
  config.vm.hostname = 'kubernetes-1.27'
  config.vm.box = 'alvistack/kubernetes-1.27'

  config.vm.provider :libvirt do |libvirt|
    libvirt.cpu_mode = 'host-passthrough'
    libvirt.cpus = 2
    libvirt.disk_bus = 'virtio'
    libvirt.disk_driver :cache => 'writeback'
    libvirt.driver = 'kvm'
    libvirt.memory = 8192
    libvirt.memorybacking :access, :mode => 'shared'
    libvirt.nested = true
    libvirt.nic_model_type = 'virtio'
    libvirt.storage :file, bus: 'virtio', cache: 'writeback'
    libvirt.video_type = 'virtio'
  end

  config.vm.synced_folder ".", "/vagrant", type: "virtiofs"

  config.vm.provision "shell", inline: <<-SCRIPT
    set -euxo pipefail
    apt update 
    apt -y full-upgrade
    apt -y install qemu-guest-agent
    until [[ $(kubectl get --raw='/readyz?verbose' | grep 'check passed') ]]; do sleep 10; done
    ansible-playbook /etc/ansible/playbooks/60-kube_cilium-install.yml
    until [[ $(kubectl get pod --all-namespaces -o wide | grep '0/' | wc -l) -eq 0 ]]; do sleep 10; done
    kubectl apply -Rf /vagrant/sites/default/kubernetes
    until [[ $(kubectl get pod --all-namespaces -o wide | grep '0/' | wc -l) -eq 0 ]]; do sleep 10; done
    ip addr
  SCRIPT
end
