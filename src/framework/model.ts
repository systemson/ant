import { ParsedQs } from "qs";
import { BaseEntity, FindManyOptions } from "typeorm";
import { Request } from "./router";

type PaginatedResponse<T extends BaseEntity> = {
    data: T[];
    from: number;
    to: number;
    per_page: number;
    last_page: number;
    current_page: number;
    total: number;
}

export class Model extends BaseEntity  {
    static async paginate<T extends BaseEntity>(this: new () => T, req: Request): Promise<PaginatedResponse<T>> {
        const query = req.query;

        const perPage = parseInt(query?.per_page as string) || 20;
        const page = parseInt(query?.page as string) || 1;
        const skip = perPage * (page - 1);
        const from = skip + 1;
        const to = skip + perPage;
        const conditionKeys = Object.keys(query).filter(key => (this as any).getColumns().includes(key));

        const contidions: ParsedQs = {};

        for (const key of conditionKeys) {
            contidions[key] = query[key];
        }

        let orderBy = undefined;

        if (query.order_by) {
            const orderByArray = (query.order_by as string).split(",").map(order => {
                const result = order.split(":");
                const ret: any = {};
                ret[(result[0] as string)] = result[1] || "ASC";
                return ret;
            });

            orderBy = Object.assign({}, ...orderByArray);
        }

        const options: FindManyOptions<T> = {
            take: perPage,
            skip: skip,
            select: (query.select as string)?.split(",") as (keyof T)[],
            where: contidions,
            order: orderBy,
        };
        
        const data = await (this as any)
            .getRepository()
            .findAndCount(options);

        const total = data[1];

        return {
            data: data[0] as T[],
            from: from,
            to: to > total ? total : to,
            per_page: perPage,
            total: total,
            current_page: page,
            last_page: Math.ceil(data[1] / perPage),
        };
    }

    protected static getColumns(): string[] {
        return this.getRepository().metadata.columns.map(col => col.propertyName);
    }

    protected static getModifiers(): string[] {
        return [
            "_Not",
            "_like",
            "_gte",
            "_lte",
            "_null",
        ];
    }
}
