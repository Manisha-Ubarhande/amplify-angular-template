import { Component, OnInit } from '@angular/core';
import { Storage } from 'aws-amplify';

@Component({
  selector: 'app-file-manager',
  templateUrl: './file-manager.component.html',
})
export class FileManagerComponent implements OnInit {
  files: any[] = [];
  selectedFile: File | null = null;

  async ngOnInit() {
    await this.loadFiles();
  }

  async loadFiles() {
    const result = await Storage.list('');
    this.files = result;
  }

  onFileSelected(event: any) {
    this.selectedFile = event.target.files[0];
  }

  async uploadFile() {
    if (!this.selectedFile) return;

    await Storage.put(this.selectedFile.name, this.selectedFile);
    this.selectedFile = null;
    await this.loadFiles();
  }

  async downloadFile(key: string) {
    const url = await Storage.get(key);
    window.open(url);
  }

  async deleteFile(key: string) {
    await Storage.remove(key);
    await this.loadFiles();
  }
}
