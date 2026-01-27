"""
Скрипт для миграции данных из PostgreSQL в MySQL.
Запуск: python scripts/migrate_pg_to_mysql.py
"""
import asyncio
from sqlalchemy import create_engine, MetaData, text
from sqlalchemy.orm import sessionmaker

# Настройки подключения
POSTGRES_URL = "postgresql://eurobot:eurobot@localhost:5432/eurobot"
MYSQL_URL = "mysql+pymysql://root:igor1412@localhost:3306/eurobot"

# Таблицы для миграции (в правильном порядке из-за foreign keys)
TABLES_ORDER = [
    'users',
    'news_categories',
    'tags',
    'seasons',
    'news',
    'news_tags',
    'partners',
    'teams',
    'team_members',
    'competitions',
    'registration_fields',
    'archive_seasons',
    'archive_media',
    'contact_messages',
    'site_settings',
    'admin_logs',
    'email_logs',
    'mass_mailing_campaigns',
]


def migrate():
    print("🚀 Начинаем миграцию PostgreSQL → MySQL...")
    
    # Подключение к PostgreSQL
    pg_engine = create_engine(POSTGRES_URL)
    pg_meta = MetaData()
    pg_meta.reflect(bind=pg_engine)
    
    # Подключение к MySQL
    mysql_engine = create_engine(MYSQL_URL)
    
    PgSession = sessionmaker(bind=pg_engine)
    MysqlSession = sessionmaker(bind=mysql_engine)
    
    pg_session = PgSession()
    mysql_session = MysqlSession()
    
    try:
        # Отключаем проверку foreign keys в MySQL
        mysql_session.execute(text("SET FOREIGN_KEY_CHECKS = 0"))
        mysql_session.commit()
        
        for table_name in TABLES_ORDER:
            if table_name not in pg_meta.tables:
                print(f"⏭️  Таблица {table_name} не найдена в PostgreSQL, пропускаем")
                continue
                
            table = pg_meta.tables[table_name]
            
            # Читаем данные из PostgreSQL
            result = pg_session.execute(table.select())
            rows = result.fetchall()
            columns = result.keys()
            
            if not rows:
                print(f"⏭️  Таблица {table_name} пустая, пропускаем")
                continue
            
            # Очищаем таблицу в MySQL
            mysql_session.execute(text(f"DELETE FROM `{table_name}`"))
            
            # Вставляем данные в MySQL
            for row in rows:
                row_dict = dict(zip(columns, row))
                
                # Формируем INSERT запрос
                cols = ', '.join([f"`{c}`" for c in row_dict.keys()])
                placeholders = ', '.join([f":{c}" for c in row_dict.keys()])
                
                insert_sql = text(f"INSERT INTO `{table_name}` ({cols}) VALUES ({placeholders})")
                
                try:
                    mysql_session.execute(insert_sql, row_dict)
                except Exception as e:
                    print(f"⚠️  Ошибка вставки в {table_name}: {e}")
                    continue
            
            mysql_session.commit()
            print(f"✅ Таблица {table_name}: {len(rows)} записей перенесено")
        
        # Включаем обратно проверку foreign keys
        mysql_session.execute(text("SET FOREIGN_KEY_CHECKS = 1"))
        mysql_session.commit()
        
        print("\n🎉 Миграция завершена успешно!")
        
    except Exception as e:
        print(f"\n❌ Ошибка миграции: {e}")
        mysql_session.rollback()
        raise
    finally:
        pg_session.close()
        mysql_session.close()


if __name__ == "__main__":
    migrate()
