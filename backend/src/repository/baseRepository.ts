import { Model, FindOptions, ModelStatic, WhereOptions, CreateOptions, UpdateOptions } from 'sequelize';
import { MakeNullishOptional } from 'sequelize/types/utils';

interface paginateQuery extends FindOptions {
    page?: number | string;
    perPage?: number | string;
}

class BaseRepository<T extends Model> {
    private model: ModelStatic<T>;
    constructor(model: ModelStatic<T>) {
        this.model = model;
    }
    async paginate(options: paginateQuery = {}): Promise<{ data: any[], total: number, currentPage: string | number, totalPages: number, perPage: number }> {
        options.limit = Number(options.perPage) || 10;
        options.offset = options.page ? options.limit * (Number(options.page) - 1) : 0;
        const { count, rows } = await this.model.findAndCountAll({ ...options, distinct: true });
        const totalPages = Math.ceil(count / options.limit);
        const currentPage = options.page || 1;
        return {
            data: rows,
            total: count,
            currentPage,
            totalPages,
            perPage: options.limit,
        };
    }

    async findOne(options: paginateQuery): Promise<T | null> {
        return await this.model.findOne(options);
    }
    async findByPk(value: string | number, options?: any): Promise<T | null> {
        // const result = await this.model.findByPk(value);
        // return result ? result.get() : null;
        return await this.model.findByPk(value, options);
    }
    async findByKey(value: number | string, key: string | null | undefined = null): Promise<T | null> {
        if (key) {
            return await this.model.findOne({ where: { [key]: value } as WhereOptions });
        }
        return await this.model.findByPk(value);
    }
    async findAll(options: paginateQuery = {}): Promise<null | any[]> {
        return await this.model.findAll(options);
    }
    async findOrCreate(options: paginateQuery): Promise<object> {
        return await this.model.findOrCreate(options);
    }
    build(attribute: MakeNullishOptional<T['_creationAttributes']>) {
        return this.model.build(attribute);
    }

    async create(values?: T['_creationAttributes'], options?: CreateOptions<T['_creationAttributes']>): Promise<T> {
        const result = await this.model.create(values, options);
        return result.toJSON();
    }

    async bulkCreate(attribute: Array<MakeNullishOptional<T['_creationAttributes']>>): Promise<object> {
        return await this.model.bulkCreate(attribute);
    }


    async update(attribute: object, options: UpdateOptions): Promise<object> {
        return await this.model.update(attribute, options);
    }
    async destroy(condition: { where: WhereOptions }): Promise<number> {
        return await this.model.destroy(condition);
    }
    async truncate(): Promise<number> {
        return await this.model.destroy({ truncate: true });
    }
}
export = BaseRepository;
