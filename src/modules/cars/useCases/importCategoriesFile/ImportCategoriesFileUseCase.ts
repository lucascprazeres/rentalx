import csvParse from "csv-parse";
import fs from "fs";

import { ICategoriesRepository } from "../../repositories/ICategoriesRepository";

interface IImportCategory {
  name: string;
  description: string;
}

export class ImportCategoriesFileUseCase {
  constructor(private categoriesRepository: ICategoriesRepository) {}

  private async loadFile(
    file: Express.Multer.File
  ): Promise<IImportCategory[]> {
    return new Promise((resolve, reject) => {
      const stream = fs.createReadStream(file.path);
      const categories: IImportCategory[] = [];

      const parseFile = csvParse();

      stream.pipe(parseFile);

      parseFile
        .on("data", async (line) => {
          const [name, description] = line;

          categories.push({
            name,
            description,
          });
        })
        .on("end", () => {
          fs.promises.unlink(file.path);
          resolve(categories);
        })
        .on("error", (error) => reject(error));
    });
  }

  async execute(file: Express.Multer.File): Promise<void> {
    const categories = await this.loadFile(file);

    categories.map(async ({ name, description }) => {
      const foundCategory = await this.categoriesRepository.findByName(name);

      if (!foundCategory) {
        await this.categoriesRepository.create({ name, description });
      }
    });
  }
}