import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';

export class FileUtils {
  /**
   * 确保目录存在，不存在则创建
   * @param dirPath 目录路径
   */
  static ensureDir(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  /**
   * 读取文件内容
   * @param filePath 文件路径
   * @returns Buffer
   */
  static readFile(filePath: string): Buffer {
    if (!fs.existsSync(filePath)) {
      throw new Error(`文件不存在: ${filePath}`);
    }
    return fs.readFileSync(filePath);
  }

  /**
   * 写入文件
   * @param filePath 文件路径
   * @param data 数据
   */
  static writeFile(filePath: string, data: string | Buffer): void {
    this.ensureDir(path.dirname(filePath));
    fs.writeFileSync(filePath, data);
  }

  /**
   * 删除文件
   * @param filePath 文件路径
   */
  static deleteFile(filePath: string): void {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  /**
   * 检查文件是否存在
   * @param filePath 文件路径
   * @returns boolean
   */
  static fileExists(filePath: string): boolean {
    return fs.existsSync(filePath);
  }

  /**
   * 从URL下载文件
   * @param url 下载URL
   * @returns Promise<Buffer>
   */
  static async downloadFromUrl(url: string): Promise<Buffer> {
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 30000,
    });
    return Buffer.from(response.data);
  }

  /**
   * 获取uploads目录路径
   * @returns string
   */
  static getUploadDir(): string {
    return path.join(process.cwd(), 'uploads');
  }

  /**
   * 生成唯一文件名
   * @param prefix 前缀
   * @param extension 扩展名
   * @returns string
   */
  static generateUniqueFileName(
    prefix: string = '',
    extension: string = 'png',
  ): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return prefix
      ? `${prefix}_${timestamp}_${random}.${extension}`
      : `${timestamp}_${random}.${extension}`;
  }

  /**
   * 获取文件扩展名
   * @param filePath 文件路径
   * @returns string
   */
  static getFileExtension(filePath: string): string {
    return path.extname(filePath).substring(1).toLowerCase();
  }

  /**
   * 从本地路径或URL获取文件
   * @param imageUrl 图片URL或本地路径
   * @param uploadDir uploads目录路径
   * @returns Promise<Buffer>
   */
  static async getImageBuffer(
    imageUrl: string,
    uploadDir: string,
  ): Promise<Buffer> {
    let imageBuffer: Buffer;
    if (imageUrl.startsWith('/uploads/')) {
      const filename = imageUrl.replace('/uploads/', '');
      const filePath = path.join(uploadDir, filename);

      if (fs.existsSync(filePath)) {
        imageBuffer = fs.readFileSync(filePath);
      } else {
        throw new Error('图片文件不存在');
      }
    } else {
      imageBuffer = await FileUtils.downloadFromUrl(imageUrl);
    }
    return imageBuffer;
  }

  /**
   * 保存文件到uploads目录
   * @param filename 文件名
   * @param data 数据
   * @param uploadDir uploads目录路径
   * @returns string 文件访问路径
   */
  static saveToUploads(
    filename: string,
    data: Buffer,
    uploadDir: string,
  ): string {
    const savePath = path.join(uploadDir, filename);
    fs.writeFileSync(savePath, data);
    return `/uploads/${filename}`;
  }
}
