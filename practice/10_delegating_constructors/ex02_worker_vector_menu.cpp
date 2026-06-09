// Раздел 10. Делегирование конструкторов.
//
// Задача: сделать меню для списка рабочих.
//
// Что нужно сделать:
// 1. Использовать class Worker с делегирующими конструкторами.
// 2. Хранить рабочих в std::vector<Worker>.
// 3. Добавить несколько рабочих заранее.
// 4. Сделать меню: показать, добавить, редактировать, удалить, выйти.
// 5. При редактировании не менять id.

#include <iostream>
#include <string>
#include <vector>

class Worker {
private:
    int id;
    std::string fullName;
    std::string gender;
    int age;
    std::string position;
    std::string department;

public:
    Worker(int id, const std::string& fullName);
    Worker(int id, const std::string& fullName, const std::string& gender);
    Worker(int id, const std::string& fullName, const std::string& gender, int age);
    Worker(int id, const std::string& fullName, const std::string& gender, int age, const std::string& position);
    Worker(int id, const std::string& fullName, const std::string& gender, int age, const std::string& position, const std::string& department);

    int getId() const;
    void editWithoutId(const std::string& newFullName, const std::string& newGender, int newAge, const std::string& newPosition, const std::string& newDepartment);
    void print() const;
};

// TODO: реализуйте Worker.

void printWorkers(const std::vector<Worker>& workers) {
    // TODO: если список пуст, выведите сообщение.
    // TODO: иначе выведите рабочих с номерами от 1.
}

int main() {
    std::vector<Worker> workers;

    // TODO: добавьте 2-3 рабочих заранее через emplace_back.

    int choice = 0;

    while (choice != 5) {
        std::cout << "\n1. Show workers\n";
        std::cout << "2. Add worker\n";
        std::cout << "3. Edit worker\n";
        std::cout << "4. Delete worker\n";
        std::cout << "5. Exit\n";
        std::cout << "Choice: ";
        std::cin >> choice;

        // TODO: обработайте пункты меню.
    }

    return 0;
}
