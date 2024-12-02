#!/usr/bin/bash

set -euo pipefail

pull_from_mirror() {
    ssh rsync.net rsync -avh rsync://mirrors.dotsrc.org/archlinuxarm/aarch64/ mirrors/archlinuxarm/aarch64
}

push_to_bucket() {
    ssh rsync.net rclone sync --copy-links --progress mirrors/archlinuxarm/aarch64 r2:arctux-repo/aarch64
}

main() {
    pull_from_mirror
    push_to_bucket
}

main "$@"
